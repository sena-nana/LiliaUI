import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

const WINDOWS_SHORTCUT_SCRIPT = [
  "$shell = New-Object -ComObject WScript.Shell",
  "$shortcut = $shell.CreateShortcut($env:LILIA_SHORTCUT_PATH)",
  "$shortcut.TargetPath = $env:LILIA_SHORTCUT_TARGET",
  "$shortcut.WorkingDirectory = $env:LILIA_SHORTCUT_WORKDIR",
  "$shortcut.IconLocation = \"$env:LILIA_SHORTCUT_TARGET,0\"",
  "$shortcut.Description = $env:LILIA_SHORTCUT_DESCRIPTION",
  "$shortcut.Save()",
].join("; ");

export function tauriInstallBuildArgs(platform, appDir = "") {
  const prefix = appDir ? ["--cwd", appDir] : [];
  if (platform === "darwin") return [...prefix, "build", "--bundles", "app"];
  if (platform === "win32" || platform === "linux") {
    return [...prefix, "build", "--no-bundle"];
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

export function readCargoAppLayout(projectRoot, appDir = "", env = process.env) {
  const appRoot = resolve(projectRoot, appDir || ".");
  const manifestPath = resolve(appRoot, "src-tauri/Cargo.toml");
  const result = spawnSync(
    "cargo",
    ["metadata", "--no-deps", "--format-version", "1", "--manifest-path", manifestPath],
    {
      cwd: projectRoot,
      env,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(`cargo metadata failed for ${manifestPath}${detail ? `\n${detail}` : ""}`);
  }
  return selectCargoAppLayout(JSON.parse(result.stdout), manifestPath);
}

export function selectCargoAppLayout(metadata, manifestPath) {
  const expectedManifest = resolve(manifestPath);
  const appPackage = metadata.packages?.find(
    (candidate) => resolve(candidate.manifest_path) === expectedManifest,
  );
  if (!appPackage) {
    throw new Error(`Cargo metadata does not contain app manifest: ${expectedManifest}`);
  }

  const binTargets = appPackage.targets?.filter((target) => target.kind?.includes("bin")) ?? [];
  let binTarget;
  if (appPackage.default_run) {
    binTarget = binTargets.find((target) => target.name === appPackage.default_run);
    if (!binTarget) {
      throw new Error(`Cargo default-run is not a binary target: ${appPackage.default_run}`);
    }
  } else if (binTargets.length === 1) {
    [binTarget] = binTargets;
  } else {
    throw new Error(
      `Expected one Cargo binary target for ${expectedManifest}, found ${binTargets.length}; set package.default-run`,
    );
  }

  if (!metadata.target_directory) {
    throw new Error("Cargo metadata did not report target_directory");
  }
  return {
    binName: binTarget.name,
    targetDirectory: resolve(metadata.target_directory),
  };
}

export function createTauriInstallPlan(options) {
  const {
    platform,
    projectRoot,
    appDir = "",
    appConfig,
    build,
    cargoLayout,
    desktopDir,
  } = options;
  const buildArgs = tauriInstallBuildArgs(platform, appDir);
  const productTitle = safeShortcutStem(appConfig.productTitle, appConfig.appName);
  const releaseDir = join(cargoLayout.targetDirectory, "release");
  const artifact = platform === "darwin"
    ? {
        kind: "app",
        path: join(releaseDir, "bundle", "macos", `${appConfig.productTitle}.app`),
      }
    : {
        kind: "executable",
        path: join(releaseDir, `${cargoLayout.binName}${platform === "win32" ? ".exe" : ""}`),
      };
  const shortcut = {
    win32: { kind: "windows-lnk", path: join(desktopDir, `${productTitle}.lnk`) },
    darwin: { kind: "macos-app-symlink", path: join(desktopDir, `${productTitle}.app`) },
    linux: { kind: "linux-desktop-entry", path: join(desktopDir, `${productTitle}.desktop`) },
  }[platform];
  if (!shortcut) throw new Error(`Unsupported platform: ${platform}`);

  return {
    platform,
    build: {
      command: build.command,
      args: [...build.argsPrefix, ...buildArgs],
    },
    artifact,
    shortcut: {
      ...shortcut,
      target: artifact.path,
    },
    iconPath: resolve(projectRoot, appDir || ".", "src-tauri/icons/icon.png"),
  };
}

export function resolveDesktopDirectory(platform, env = process.env) {
  let desktopDir;
  if (platform === "win32") {
    desktopDir = capture("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Environment]::GetFolderPath('DesktopDirectory')",
    ], env);
  } else if (platform === "darwin") {
    desktopDir = capture("osascript", ["-e", "POSIX path of (path to desktop folder)"], env);
  } else if (platform === "linux") {
    desktopDir = tryCapture("xdg-user-dir", ["DESKTOP"], env);
    if (!desktopDir || !isDirectory(desktopDir)) {
      const fallback = join(env.HOME || homedir(), "Desktop");
      desktopDir = isDirectory(fallback) ? fallback : "";
    }
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const resolved = desktopDir ? resolve(desktopDir) : "";
  if (!resolved || !isDirectory(resolved)) {
    throw new Error(`Desktop directory does not exist: ${resolved || "(not found)"}`);
  }
  return resolved;
}

export function createDesktopShortcut(plan, appConfig, env = process.env) {
  assertArtifact(plan.artifact);
  if (plan.platform === "win32") {
    const command = windowsShortcutCommand(plan, appConfig, env);
    run(command.command, command.args, { env: command.env });
    return;
  }
  if (plan.platform === "darwin") {
    const current = lstatIfExists(plan.shortcut.path);
    if (current) {
      if (!current.isSymbolicLink()) {
        throw new Error(`Refusing to replace non-symlink desktop item: ${plan.shortcut.path}`);
      }
      unlinkSync(plan.shortcut.path);
    }
    symlinkSync(plan.artifact.path, plan.shortcut.path, "dir");
    return;
  }
  if (plan.platform === "linux") {
    const current = lstatIfExists(plan.shortcut.path);
    if (current && !current.isFile()) {
      throw new Error(`Refusing to replace non-file desktop item: ${plan.shortcut.path}`);
    }
    const temporaryPath = `${plan.shortcut.path}.${process.pid}.tmp`;
    try {
      writeFileSync(
        temporaryPath,
        linuxDesktopEntry(plan, appConfig),
        { encoding: "utf-8", mode: 0o755 },
      );
      chmodSync(temporaryPath, 0o755);
      renameSync(temporaryPath, plan.shortcut.path);
    } finally {
      rmSync(temporaryPath, { force: true });
    }
    return;
  }
  throw new Error(`Unsupported platform: ${plan.platform}`);
}

export function windowsShortcutCommand(plan, appConfig, env = process.env) {
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-NonInteractive", "-Command", WINDOWS_SHORTCUT_SCRIPT],
    env: {
      ...env,
      LILIA_SHORTCUT_PATH: plan.shortcut.path,
      LILIA_SHORTCUT_TARGET: plan.artifact.path,
      LILIA_SHORTCUT_WORKDIR: dirname(plan.artifact.path),
      LILIA_SHORTCUT_DESCRIPTION: appConfig.productTitle,
    },
  };
}

export function linuxDesktopEntry(plan, appConfig) {
  const lines = [
    "[Desktop Entry]",
    "Version=1.0",
    "Type=Application",
    `Name=${desktopString(appConfig.productTitle)}`,
    `Exec=${desktopExecArgument(plan.artifact.path)}`,
    `Path=${desktopString(dirname(plan.artifact.path))}`,
  ];
  if (plan.iconPath && existsSync(plan.iconPath)) {
    lines.push(`Icon=${desktopString(plan.iconPath)}`);
  }
  lines.push("Terminal=false", "StartupNotify=true", "");
  return lines.join("\n");
}

function safeShortcutStem(productTitle, fallback) {
  const clean = String(productTitle || fallback || "Lilia App")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  if (!clean || clean === "." || clean === "..") {
    throw new Error("App product title cannot be used as a desktop shortcut name");
  }
  return clean;
}

function desktopString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function desktopExecArgument(value) {
  const path = String(value);
  if (/[=\n\r\t]/.test(path)) {
    throw new Error(`Linux executable path contains unsupported characters: ${path}`);
  }
  const escaped = path
    .replace(/%/g, "%%")
    .replace(/\\/g, "\\\\\\\\")
    .replace(/([\"`$])/g, "\\\\$1");
  return `"${escaped}"`;
}

function assertArtifact(artifact) {
  if (!isAbsolute(artifact.path) || !existsSync(artifact.path)) {
    throw new Error(`Built application does not exist: ${artifact.path}`);
  }
  const stat = lstatSync(artifact.path);
  if (artifact.kind === "app" ? !stat.isDirectory() : !stat.isFile()) {
    throw new Error(`Built application has unexpected type: ${artifact.path}`);
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function lstatIfExists(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function capture(command, args, env) {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
  return (result.stdout ?? "").trim();
}

function tryCapture(command, args, env) {
  try {
    return capture(command, args, env);
  } catch {
    return "";
  }
}

function run(command, args, options = {}) {
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
