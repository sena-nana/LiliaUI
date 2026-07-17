import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { dirname, extname, join, resolve } from "node:path";
import { readAppConfig } from "@lilia/config";
import { checkPackageManager, copyLiliaAssets, syncAppConfig } from "@lilia/tools";
import {
  createDesktopShortcut,
  createTauriInstallPlan,
  readCargoAppLayout,
  resolveDesktopDirectory,
} from "./tauriInstall.mjs";

const DEFAULT_PORT = 1420;
const LOCALHOST_CHECK_HOSTS = ["127.0.0.1", "::1"];
const NATIVE_CPU_FLAG = "-C target-cpu=native";
const packageRequire = createRequire(import.meta.url);
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

export function createTauriDevBuildConfig(port, options = {}) {
  const build = {
    devUrl: `http://localhost:${port}`,
  };
  if (options.beforeDevCommand !== false) {
    build.beforeDevCommand = options.beforeDevCommand ??
      `yarn dev --host localhost --port ${port} --strictPort`;
  }
  return build;
}

export function viteDevArgs(projectRoot = process.cwd(), args = [], env = process.env) {
  if (hasViteOption(args, "--port") || hasViteOption(args, "-p")) {
    return ["vite", ...args];
  }

  const envPrefix = toEnvPrefix(readAppConfig(projectRoot).appName);
  const envPort = env[`${envPrefix}_DEV_PORT`];
  if (!envPort) {
    return ["vite", ...args];
  }

  const nextArgs = ["vite", "--host", "localhost", "--port", String(parsePort(envPort)), ...args];
  if (env[`${envPrefix}_DEV_STRICT_PORT`] === "1" && !hasViteOption(args, "--strictPort")) {
    nextArgs.push("--strictPort");
  }
  return nextArgs;
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

export function resolveToolCommand(packageName, binName, args = [], projectRoot = process.cwd()) {
  return {
    command: process.execPath,
    args: [resolvePackageBin(packageName, binName, projectRoot), ...args],
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
  if (!existsSync(resolve(projectRoot, "app.config.json"))) {
    return;
  }
  syncAppConfig(projectRoot);
  copyLiliaAssets(projectRoot);
}

export async function runTauriDev(projectRoot = process.cwd(), argv = [], env = process.env, options = {}) {
  const appConfig = resolveRuntimeAppConfig(projectRoot, options);
  const envPrefix = toEnvPrefix(appConfig.appName);
  const startPort = parsePort(env[`${envPrefix}_DEV_PORT`]);
  const port = await findAvailablePort(startPort);
  const build = createTauriDevBuildConfig(port, {
    beforeDevCommand: options.beforeDevCommand,
  });
  const config = JSON.stringify({ build });
  const cliArgs = [
    ...(options.appDir ? ["--cwd", options.appDir] : []),
    "dev",
    "--config",
    config,
    ...argv,
  ];
  const nextEnv = {
    ...env,
    [`${envPrefix}_DEV_PORT`]: String(port),
    [`${envPrefix}_DEV_STRICT_PORT`]: "1",
    ...resolveExtraEnv(options.extraEnv, env, appConfig),
  };
  const tauriCommand = resolveToolCommand("@tauri-apps/cli", "tauri", cliArgs);

  const dryRunKey = options.dryRunEnvKey ?? `${envPrefix}_DEV_DRY_RUN`;
  if (env[dryRunKey] === "1") {
    process.stdout.write(`${JSON.stringify({
      command: tauriCommand.command,
      spawnArgs: tauriCommand.args,
      args: cliArgs,
      devUrl: build.devUrl,
      env: {
        [`${envPrefix}_DEV_PORT`]: nextEnv[`${envPrefix}_DEV_PORT`],
        [`${envPrefix}_DEV_STRICT_PORT`]: nextEnv[`${envPrefix}_DEV_STRICT_PORT`],
        ...pickEnv(nextEnv, options.dryRunEnvKeys ?? []),
      },
    })}\n`);
    return;
  }

  console.log(`[${appConfig.appName}] Starting Tauri dev server at ${build.devUrl}`);
  await spawnInherited(tauriCommand.command, tauriCommand.args, {
    cwd: projectRoot,
    env: nextEnv,
  });
}

export function runTauriInstall(projectRoot = process.cwd(), env = process.env, options = {}) {
  const appConfig = resolveRuntimeAppConfig(projectRoot, options);
  const envPrefix = toEnvPrefix(appConfig.appName);
  const buildEnv = nativeBuildEnv(env);
  const platform = options.platform ?? process.platform;
  const tauri = resolveToolCommand("@tauri-apps/cli", "tauri");
  const cargoLayout = readCargoAppLayout(projectRoot, options.appDir, buildEnv);
  const desktopDir = options.desktopDir ?? resolveDesktopDirectory(platform, env);
  const plan = createTauriInstallPlan({
    platform,
    projectRoot,
    appDir: options.appDir,
    appConfig,
    build: { command: tauri.command, argsPrefix: tauri.args },
    cargoLayout,
    desktopDir,
  });
  const dryRunKey = options.dryRunEnvKey ?? `${envPrefix}_INSTALL_DRY_RUN`;

  if (env[dryRunKey] === "1") {
    process.stdout.write(`${JSON.stringify({
      platform: plan.platform,
      build: {
        ...plan.build,
        env: { RUSTFLAGS: buildEnv.RUSTFLAGS },
      },
      artifact: plan.artifact,
      shortcut: plan.shortcut,
    }, null, 2)}\n`);
    return;
  }

  runSync(plan.build.command, plan.build.args, { cwd: projectRoot, env: buildEnv });
  createDesktopShortcut(plan, appConfig, env);
  console.log(`[tauri:install] application: ${plan.artifact.path}`);
  console.log(`[tauri:install] desktop shortcut: ${plan.shortcut.path}`);
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
      runVite(viteDevArgs(projectRoot, args, env).slice(1), { cwd: projectRoot, env });
      return;
    }
    if (command === "build") {
      runPrepare(projectRoot, env);
      runVueTsc(["--noEmit"], { cwd: projectRoot, env });
      runVite(["build", ...args], { cwd: projectRoot, env });
      return;
    }
    if (command === "test") {
      runPrepare(projectRoot, env);
      runVitest(["run", ...args], { cwd: projectRoot, env: withoutNodeCompileCache(env) });
      return;
    }
    if (command === "docs") {
      runPrepare(projectRoot, env);
      const [docsCommand = "dev", ...docsArgs] = args;
      runVitePress([docsCommand, "docs", ...docsArgs], { cwd: projectRoot, env });
      return;
    }
    if (command === "preview") {
      runPrepare(projectRoot, env);
      runVite(["preview", ...args], { cwd: projectRoot, env });
      return;
    }
    if (command === "tauri") {
      runTauri(args, { cwd: projectRoot, env });
      return;
    }
    if (command === "tauri-dev") {
      runPrepare(projectRoot, env);
      await runTauriDev(projectRoot, args, env);
      return;
    }
    if (command === "tauri-build") {
      runPrepare(projectRoot, env);
      runTauri(["build", ...args], { cwd: projectRoot, env });
      return;
    }
    if (command === "tauri-install") {
      runPrepare(projectRoot, env);
      runTauriInstall(projectRoot, env);
      return;
    }
    if (command === "verify") {
      runPrepare(projectRoot, env);
      runVitest(["run"], { cwd: projectRoot, env: withoutNodeCompileCache(env) });
      runVueTsc(["--noEmit"], { cwd: projectRoot, env });
      runVite(["build"], { cwd: projectRoot, env });
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

function withoutNodeCompileCache(env) {
  return {
    ...env,
    NODE_DISABLE_COMPILE_CACHE: "1",
  };
}

function resolveRuntimeAppConfig(projectRoot, options = {}) {
  if (options.appConfig) return options.appConfig;
  try {
    return readAppConfig(options.appConfigRoot ?? projectRoot);
  } catch {
    return {
      appName: options.appName ?? "lilia-app",
      productTitle: options.productTitle ?? options.appName ?? "Lilia App",
    };
  }
}

function resolveExtraEnv(extraEnv, env, appConfig) {
  if (!extraEnv) return {};
  if (typeof extraEnv === "function") return extraEnv(env, appConfig);
  return extraEnv;
}

function pickEnv(env, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => env[key] !== undefined)
      .map((key) => [key, env[key]]),
  );
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

function runTool(packageName, binName, args = [], options = {}) {
  const command = resolveToolCommand(packageName, binName, args, options.cwd);
  runSync(command.command, command.args, options);
}

function runVite(args = [], options = {}) {
  runTool("vite", "vite", args, options);
}

function runVitePress(args = [], options = {}) {
  runTool("vitepress", "vitepress", args, options);
}

function runVitest(args = [], options = {}) {
  runTool("vitest", "vitest", args, options);
}

function runVueTsc(args = [], options = {}) {
  runTool("vue-tsc", "vue-tsc", args, options);
}

function runTauri(args = [], options = {}) {
  runTool("@tauri-apps/cli", "tauri", args, options);
}

function resolvePackageBin(packageName, binName, projectRoot = process.cwd()) {
  const consumerRequire = createRequire(resolve(projectRoot, "package.json"));
  let packageJsonPath;
  try {
    packageJsonPath = consumerRequire.resolve(`${packageName}/package.json`);
  } catch {
    packageJsonPath = packageRequire.resolve(`${packageName}/package.json`);
  }
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const bin = packageJson.bin;
  const relativeBin = typeof bin === "string" ? bin : bin?.[binName];
  if (!relativeBin) {
    throw new Error(`Package ${packageName} does not expose bin ${binName}.`);
  }
  return resolve(dirname(packageJsonPath), relativeBin);
}

function hasViteOption(args, name) {
  return args.some((arg) => arg === name || arg.startsWith(`${name}=`));
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
    "  test",
    "  docs <dev|build|preview>",
    "  preview",
    "  tauri",
    "  tauri-dev",
    "  tauri-build [--no-bundle]",
    "  tauri-install",
    "  verify",
  ].join("\n"));
}
