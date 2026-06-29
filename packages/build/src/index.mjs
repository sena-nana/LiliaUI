import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import net from "node:net";
import { extname, join, resolve } from "node:path";
import { readAppConfig } from "@lilia/config";
import { checkPackageManager, copyLiliaAssets, syncAppConfig } from "@lilia/tools";

const DEFAULT_PORT = 1420;
const LOCALHOST_CHECK_HOSTS = ["127.0.0.1", "::1"];
const NATIVE_CPU_FLAG = "-C target-cpu=native";
const PRIORITY_EXTS = {
  win32: [".msi", ".exe"],
  darwin: [".dmg", ".pkg"],
  linux: [".appimage", ".deb", ".rpm"],
};

export function parsePort(value, fallback = DEFAULT_PORT) {
  if (!value) return fallback;
  const port = Number.parseInt(value, 10);
  if (Number.isInteger(port) && port > 0 && port < 65536) return port;
  return fallback;
}

export function canListen(host, port) {
  return new Promise((resolveListen) => {
    const server = net.createServer();
    server.once("error", (error) => {
      resolveListen(error.code === "EAFNOSUPPORT" || error.code === "EADDRNOTAVAIL");
    });
    server.once("listening", () => {
      server.close(() => resolveListen(true));
    });
    server.listen({ host, port });
  });
}

export async function isPortAvailable(port) {
  for (const host of LOCALHOST_CHECK_HOSTS) {
    if (!(await canListen(host, port))) return false;
  }
  return true;
}

export async function findAvailablePort(startPort) {
  for (let port = startPort; port < 65536; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available localhost port found from ${startPort}.`);
}

export function yarnSpawn(platform = process.platform, env = process.env) {
  if (platform !== "win32") {
    return { command: "yarn", argsPrefix: [] };
  }
  return {
    command: env.ComSpec || "cmd.exe",
    argsPrefix: ["/d", "/s", "/c", "yarn.cmd"],
  };
}

export function nativeBuildEnv(env = process.env) {
  const next = { ...env };
  const rustflags = next.RUSTFLAGS?.trim();
  next.RUSTFLAGS = rustflags && !rustflags.includes("target-cpu=")
    ? `${rustflags} ${NATIVE_CPU_FLAG}`
    : rustflags || NATIVE_CPU_FLAG;
  return next;
}

export function pickBundleFile(bundleDir, platform = process.platform) {
  if (!existsSync(bundleDir)) {
    throw new Error(`Bundle directory does not exist: ${bundleDir}`);
  }

  const files = walkFiles(bundleDir).filter((file) =>
    PRIORITY_EXTS[platform]?.includes(extname(file.path).toLowerCase()),
  );
  const exts = PRIORITY_EXTS[platform] ?? [];
  for (const ext of exts) {
    const matched = files.filter((file) => file.path.toLowerCase().endsWith(ext));
    if (matched.length > 0) {
      matched.sort((a, b) => b.mtime - a.mtime);
      return matched[0].path;
    }
  }

  throw new Error(`No supported installer found in: ${bundleDir}`);
}

export function runPrepare(projectRoot = process.cwd(), env = process.env) {
  const packageManager = checkPackageManager(projectRoot, env);
  if (!packageManager.ok) {
    throw new Error(packageManager.message);
  }
  syncAppConfig(projectRoot);
  copyLiliaAssets(projectRoot);
}

export async function runTauriDev(projectRoot = process.cwd(), argv = [], env = process.env) {
  const appConfig = readAppConfig(projectRoot);
  const envPrefix = toEnvPrefix(appConfig.appName);
  const startPort = parsePort(env[`${envPrefix}_DEV_PORT`]);
  const port = await findAvailablePort(startPort);
  const devUrl = `http://localhost:${port}`;
  const config = JSON.stringify({ build: { devUrl } });
  const args = ["tauri", "dev", "--config", config, ...argv];
  const nextEnv = {
    ...env,
    [`${envPrefix}_DEV_PORT`]: String(port),
    [`${envPrefix}_DEV_STRICT_PORT`]: "1",
  };
  const spawnConfig = yarnSpawn(process.platform, env);

  if (env[`${envPrefix}_DEV_DRY_RUN`] === "1") {
    process.stdout.write(`${JSON.stringify({
      command: spawnConfig.command,
      spawnArgs: [...spawnConfig.argsPrefix, ...args],
      args,
      devUrl,
      env: {
        [`${envPrefix}_DEV_PORT`]: nextEnv[`${envPrefix}_DEV_PORT`],
        [`${envPrefix}_DEV_STRICT_PORT`]: nextEnv[`${envPrefix}_DEV_STRICT_PORT`],
      },
    })}\n`);
    return;
  }

  console.log(`[${appConfig.appName}] Starting Tauri dev server at ${devUrl}`);
  await spawnInherited(spawnConfig.command, [...spawnConfig.argsPrefix, ...args], {
    cwd: projectRoot,
    env: nextEnv,
  });
}

export function runTauriInstall(projectRoot = process.cwd(), env = process.env) {
  const buildEnv = nativeBuildEnv(env);
  const build = yarnBuildCommand(process.platform, env);

  if (env[`${toEnvPrefix(readAppConfig(projectRoot).appName)}_INSTALL_DRY_RUN`] === "1") {
    process.stdout.write(`${JSON.stringify({ command: build.command, args: build.args, env: { RUSTFLAGS: buildEnv.RUSTFLAGS } }, null, 2)}\n`);
    return;
  }

  runSync(build.command, build.args, { cwd: projectRoot, env: buildEnv });
  const bundle = pickBundleFile(resolve(projectRoot, "src-tauri/target/release/bundle"));
  console.log(`[tauri:install] found installer: ${bundle}`);
  installBundle(bundle, process.platform, env);
  console.log(`[tauri:install] installer launched: ${bundle}`);
}

export async function runBuildCli(argv, options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const env = options.env ?? process.env;
  const [command, ...args] = argv;

  try {
    if (command === "prepare") {
      runPrepare(projectRoot, env);
      return;
    }
    if (command === "dev") {
      runPrepare(projectRoot, env);
      runYarn(argsFor("vite", args), { cwd: projectRoot, env });
      return;
    }
    if (command === "build") {
      runPrepare(projectRoot, env);
      runYarn(["vue-tsc", "--noEmit"], { cwd: projectRoot, env });
      runYarn(["vite", "build", ...args], { cwd: projectRoot, env });
      return;
    }
    if (command === "docs") {
      runPrepare(projectRoot, env);
      const [docsCommand = "dev", ...docsArgs] = args;
      runYarn(["vitepress", docsCommand, "docs", ...docsArgs], { cwd: projectRoot, env });
      return;
    }
    if (command === "tauri-dev") {
      runPrepare(projectRoot, env);
      await runTauriDev(projectRoot, args, env);
      return;
    }
    if (command === "tauri-build") {
      runPrepare(projectRoot, env);
      runYarn(["tauri", "build", ...args], { cwd: projectRoot, env });
      return;
    }
    if (command === "tauri-install") {
      runPrepare(projectRoot, env);
      runTauriInstall(projectRoot, env);
      return;
    }
    if (command === "verify") {
      runYarn(["test"], { cwd: projectRoot, env });
      runYarn(["build"], { cwd: projectRoot, env });
      runSync("cargo", ["check", "--manifest-path", "src-tauri/Cargo.toml"], { cwd: projectRoot, env });
      return;
    }

    printBuildUsage();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "lilia-build failed.");
    process.exitCode = 1;
  }
}

function yarnBuildCommand(platform = process.platform, env = process.env) {
  if (platform === "win32") {
    return {
      command: env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", "yarn.cmd tauri build"],
    };
  }
  return { command: "yarn", args: ["tauri", "build"] };
}

function installBundle(path, platform = process.platform, env = process.env) {
  const ext = extname(path).toLowerCase();

  if (platform === "win32") {
    if (ext === ".msi") return runSync("msiexec", ["/i", path, "/qn", "/norestart"]);
    return runSync(env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `start "" "${path}"`]);
  }
  if (platform === "darwin") return runSync("open", [path]);
  if (platform === "linux") {
    if (ext === ".deb") return runSync("sudo", ["dpkg", "-i", path]);
    if (ext === ".rpm") return runSync("sudo", ["rpm", "-i", path]);
    return runSync("xdg-open", [path]);
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

function runSync(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    shell: false,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function runYarn(args = [], options = {}) {
  const spawnConfig = yarnSpawn(process.platform, options.env ?? process.env);
  runSync(spawnConfig.command, [...spawnConfig.argsPrefix, ...args], options);
}

function argsFor(command, args) {
  return [command, ...args];
}

function spawnInherited(command, args = [], options = {}) {
  return new Promise((resolveSpawn, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (code === 0) {
        resolveSpawn();
      } else {
        reject(new Error(`Command failed (${code ?? 1}): ${command} ${args.join(" ")}`));
      }
    });
  });
}

function walkFiles(dir) {
  const files = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (item.isFile()) {
      files.push({ path: full, mtime: statSync(full).mtimeMs });
    }
  }
  return files;
}

function toEnvPrefix(appName) {
  return appName.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function printBuildUsage() {
  console.error([
    "Usage: lilia-build <command>",
    "",
    "Commands:",
    "  prepare",
    "  dev",
    "  build",
    "  docs <dev|build|preview>",
    "  tauri-dev",
    "  tauri-build [--no-bundle]",
    "  tauri-install",
    "  verify",
  ].join("\n"));
}
