import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  calculateNextVersion,
  readAppConfig,
  readJson,
  syncFromAppConfig,
  validateAppConfig,
  writeIfChanged,
} from "@lilia/config";
import {
  createAgentDebugReportFromTemplate,
  printAgentDebugReport,
} from "./agentDebugReport.mjs";
import { generateOpenSourceLicenseManifest } from "./licenseManifest.mjs";

export const LILIA_TOOLS_ASSETS_ROOT = fileURLToPath(new URL("../assets/", import.meta.url));

export function checkPackageManager(projectRoot = process.cwd(), env = process.env) {
  const packageJson = readJson(resolve(projectRoot, "package.json"));
  const requiredPackageManager = packageJson.packageManager;
  const requiredYarnVersion = /^yarn@([^+]+)/.exec(requiredPackageManager ?? "")?.[1];
  const userAgent = env.npm_config_user_agent ?? "";
  const yarnMatch = userAgent.match(/\byarn\/([^\s]+)/);
  const yarnVersion = yarnMatch?.[1];
  const yarnMajor = Number.parseInt(yarnVersion?.split(".")[0] ?? "", 10);

  if (yarnMajor >= 4 && yarnVersion === requiredYarnVersion) {
    return { ok: true, message: "" };
  }

  const reason = yarnVersion
    ? `Detected Yarn ${yarnVersion}.`
    : userAgent
      ? `Detected package manager: ${userAgent}.`
      : "Could not detect the active package manager.";

  return {
    ok: false,
    message: formatPackageManagerMessage({
      productTitle: readOptionalProductTitle(projectRoot, packageJson.name),
      reason,
      requiredPackageManager,
    }),
  };
}

function readOptionalProductTitle(projectRoot, fallback) {
  try {
    return readAppConfig(projectRoot).productTitle;
  } catch {
    return fallback ?? "Lilia App";
  }
}

export function syncAppConfig(projectRoot = process.cwd()) {
  const appConfig = readAppConfig(projectRoot);
  validateAppConfig(appConfig);
  syncFromAppConfig(appConfig, projectRoot);
  return appConfig;
}

export function bumpVersion(request, projectRoot = process.cwd()) {
  if (!request || request === "-h" || request === "--help") {
    throw new Error("Usage: lilia-tools version-bump <patch|minor|major|<x.y.z>>");
  }

  const appConfigPath = resolve(projectRoot, "app.config.json");
  const trackedFiles = [
    appConfigPath,
    resolve(projectRoot, "package.json"),
    resolve(projectRoot, "src-tauri/tauri.conf.json"),
    resolve(projectRoot, "src-tauri/Cargo.toml"),
  ].map((path) => ({
    path,
    read: () => readFileSync(path, "utf8"),
  }));
  const appConfig = readAppConfig(projectRoot);
  validateAppConfig(appConfig);

  const nextVersion = calculateNextVersion(appConfig.version, request);
  const backup = trackedFiles.map((file) => [file.path, file.read()]);

  try {
    writeIfChanged(
      appConfigPath,
      JSON.stringify({ ...appConfig, version: nextVersion }, null, 2) + "\n",
    );
    syncFromAppConfig({ ...appConfig, version: nextVersion }, projectRoot);
    return { from: appConfig.version, to: nextVersion };
  } catch (error) {
    for (const [path, content] of backup) {
      writeIfChanged(path, content);
    }
    if (error instanceof Error) {
      throw new Error(`Version bump failed: ${error.message}`);
    }
    throw error;
  }
}

export function copyLiliaAssets(projectRoot = process.cwd(), options = {}) {
  const copied = [];
  const assets = [
    {
      from: join(LILIA_TOOLS_ASSETS_ROOT, "fonts"),
      to: resolve(projectRoot, "public/fonts"),
    },
    {
      from: join(LILIA_TOOLS_ASSETS_ROOT, "icons"),
      to: resolve(projectRoot, "src-tauri/icons"),
    },
  ];

  for (const asset of assets) {
    for (const source of walkFiles(asset.from)) {
      const target = join(asset.to, relative(asset.from, source));
      if (!options.force && existsSync(target)) continue;
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
      copied.push(target);
    }
  }

  return copied;
}

export function createTemplateReport(projectRoot = process.cwd(), options = {}) {
  const packageJson = readJson(resolve(projectRoot, "package.json"));
  const appConfig = existsSync(resolve(projectRoot, "app.config.json"))
    ? readAppConfig(projectRoot)
    : {
        appName: packageJson.name ?? "application",
        productTitle: packageJson.productName ?? packageJson.name ?? "Application",
      };
  const profile = createToolsProfile(options.profile);
  const importantFiles = profile.importantFiles.map(([path, purpose]) => ({
    path,
    purpose,
    exists: existsSync(resolve(projectRoot, path)),
  }));
  const agentTargets = Object.entries(profile.agentTargetFiles).flatMap(([path, targets]) => {
    const sourcePath = resolve(projectRoot, path);
    const source = existsSync(sourcePath) ? readFileSync(sourcePath, "utf-8") : "";
    return targets.map(([id, token = id]) => ({
      id,
      path,
      exists: source.includes(`data-agent-id="${token}"`) || source.includes(token),
    }));
  });
  const expectedDependencies = profile.expectedDependencies;
  const nativeBackdropPermissions = readCapabilityPermissions(projectRoot);
  const nativeBackdropPermission = profile.nativeBackdropPermissions.find((permission) =>
    nativeBackdropPermissions.includes(permission),
  );
  const checks = [
    profile.packageManager ? {
      id: "package-manager",
      ok: packageJson.packageManager === profile.packageManager,
      detail: `packageManager=${packageJson.packageManager ?? "missing"}`,
    } : null,
    profile.requireSingleAppRoot ? {
      id: "single-app-root",
      ok: packageJson.workspaces === undefined,
      detail: packageJson.workspaces === undefined ? "no workspaces field" : "workspaces field exists",
    } : null,
    profile.expectedDependencies.length ? {
      id: "lilia-dependencies-present",
      ok: expectedDependencies.every((name) => packageJson.dependencies?.[name] !== undefined),
      detail: expectedDependencies
        .map((name) => `${name}=${packageJson.dependencies?.[name] ?? "missing"}`)
        .join(", "),
    } : null,
    profile.nativeBackdropPermissions.length ? {
      id: "native-backdrop-permission",
      ok: nativeBackdropPermission !== undefined,
      detail: nativeBackdropPermission
        ? `permission=${nativeBackdropPermission}`
        : `expected one of ${profile.nativeBackdropPermissions.join(", ")}`,
    } : null,
    {
      id: "important-files-present",
      ok: importantFiles.every((file) => file.exists),
      detail: `${importantFiles.filter((file) => file.exists).length}/${importantFiles.length} files present`,
    },
    {
      id: "agent-targets-present",
      ok: agentTargets.every((target) => target.exists),
      detail: `${agentTargets.filter((target) => target.exists).length}/${agentTargets.length} targets present`,
    },
  ].filter(Boolean);
  const gitStatus = spawnSync("git", ["status", "--short"], {
    cwd: projectRoot,
    encoding: "utf-8",
    shell: false,
  });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: {
      root: relative(process.cwd(), projectRoot) || ".",
      name: packageJson.name,
      productTitle: appConfig.productTitle,
      version: packageJson.version,
      packageManager: packageJson.packageManager,
    },
    boundaries: profile.boundaries,
    entrypoints: profile.entrypoints,
    importantFiles,
    agentTargets,
    checks,
    git: {
      available: gitStatus.error === undefined,
      dirty: gitStatus.status === 0 ? gitStatus.stdout.trim().length > 0 : null,
    },
    status: checks.every((check) => check.ok) ? "ready" : "needs_attention",
  };
  return report;
}

export function printTemplateReport(report) {
  console.log(`${report.project.productTitle} agent debug report`);
  console.log(`status: ${report.status}`);
  console.log(`root: ${report.project.root}`);
  console.log("");
  console.log("entrypoints:");
  for (const entry of report.entrypoints) {
    console.log(`- ${entry.command} (${entry.purpose})`);
  }
  console.log("");
  console.log("checks:");
  for (const check of report.checks) {
    console.log(`- ${check.ok ? "ok" : "fail"} ${check.id}: ${check.detail}`);
  }
  console.log("");
  console.log("important files:");
  for (const file of report.importantFiles) {
    console.log(`- ${file.exists ? "ok" : "missing"} ${file.path}: ${file.purpose}`);
  }
  console.log("");
  console.log("agent targets:");
  for (const target of report.agentTargets) {
    console.log(`- ${target.exists ? "ok" : "missing"} ${target.id}: ${target.path}`);
  }
}

export function createAgentDebugReport(projectRoot = process.cwd(), options = {}) {
  return createAgentDebugReportFromTemplate(projectRoot, options, createTemplateReport);
}

export { printAgentDebugReport };
export { generateOpenSourceLicenseManifest };

export async function runToolsCli(argv, options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const env = options.env ?? process.env;
  const [command, ...args] = argv;

  try {
    if (command === "check-package-manager") {
      const result = checkPackageManager(projectRoot, env);
      if (!result.ok) {
        console.error(result.message);
        process.exitCode = 1;
      }
      return;
    }

    if (command === "sync-app-config") {
      syncAppConfig(projectRoot);
      return;
    }

    if (command === "version-bump") {
      const result = bumpVersion(args[0], projectRoot);
      console.log(`Updated version: ${result.from} -> ${result.to}`);
      return;
    }

    if (command === "copy-assets") {
      const copied = copyLiliaAssets(projectRoot, { force: args.includes("--force") });
      if (args.includes("--json")) {
        process.stdout.write(`${JSON.stringify({ copied }, null, 2)}\n`);
      }
      return;
    }

    if (command === "licenses") {
      const result = await generateOpenSourceLicenseManifest({
        projectRoot: resolve(projectRoot, readFlag(args, "--project-root") ?? "."),
        outputPath: readFlag(args, "--output") ?? "src/generated/openSourceLicenseManifest.json",
        cargoManifestPath: readFlag(args, "--cargo-manifest") ?? "src-tauri/Cargo.toml",
        unknownLicense: readFlag(args, "--unknown-license") ?? "Undeclared",
      });
      if (args.includes("--json")) {
        process.stdout.write(`${JSON.stringify({
          outputPath: result.outputPath,
          counts: {
            npm: result.manifest.npmDependencies.length,
            rust: result.manifest.rustDependencies.length,
          },
        }, null, 2)}\n`);
      } else {
        console.log(`Generated ${relative(process.cwd(), result.outputPath)}`);
      }
      return;
    }

    if (command === "doctor" || command === "template-check") {
      const profile = await loadToolsProfile(projectRoot, readFlag(args, "--profile"));
      const report = createTemplateReport(projectRoot, { profile });
      if (args.includes("--json")) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      } else {
        printTemplateReport(report);
      }
      if (report.status !== "ready") {
        process.exitCode = 1;
      }
      return;
    }

    if (command === "agent-debug") {
      const profile = await loadToolsProfile(projectRoot, readFlag(args, "--profile"));
      const report = createAgentDebugReport(projectRoot, { profile });
      if (args.includes("--json")) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      } else {
        printAgentDebugReport(report);
      }
      if (report.status !== "ready") {
        process.exitCode = 1;
      }
      return;
    }

    if (command === "migrate") {
      const copied = copyLiliaAssets(projectRoot, { force: args.includes("--force") });
      if (args.includes("--json")) {
        process.stdout.write(`${JSON.stringify({ copied }, null, 2)}\n`);
      } else {
        console.log(`Copied ${copied.length} Lilia asset files.`);
      }
      return;
    }

    printToolsUsage();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "lilia-tools failed.");
    process.exitCode = 1;
  }
}

export function defineToolsProfile(profile) {
  return profile;
}

function createToolsProfile(profile = {}) {
  return {
    packageManager: null,
    requireSingleAppRoot: false,
    expectedDependencies: [],
    nativeBackdropPermissions: [],
    importantFiles: [
      ["package.json", "project package metadata"],
    ],
    agentTargetFiles: {},
    boundaries: { includes: [], excludes: [] },
    entrypoints: [],
    ...profile,
    packageManager: profile.packageManager ?? null,
  };
}

async function loadToolsProfile(projectRoot, explicitPath) {
  const profilePath = resolve(projectRoot, explicitPath ?? "lilia.tools.profile.mjs");
  if (!existsSync(profilePath)) return {};
  const module = await import(`${pathToFileURL(profilePath).href}?t=${Date.now()}`);
  const profile = module.default ?? module.profile;
  if (!profile || typeof profile !== "object") {
    throw new Error(`Tools profile must export an object: ${profilePath}`);
  }
  return profile;
}

function readCapabilityPermissions(projectRoot) {
  const capabilityPath = resolve(projectRoot, "src-tauri/capabilities/default.json");
  if (!existsSync(capabilityPath)) return [];
  try {
    const capability = readJson(capabilityPath);
    return Array.isArray(capability.permissions)
      ? capability.permissions.filter((permission) => typeof permission === "string")
      : [];
  } catch {
    return [];
  }
}

function walkFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (item.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function formatPackageManagerMessage({ productTitle, reason, requiredPackageManager }) {
  return [
    "",
    `${productTitle} requires Yarn 4 through Corepack.`,
    reason,
    "",
    `Expected package manager: ${requiredPackageManager}`,
    "",
    "Fix:",
    "  npm install --global corepack@0.35.0",
    "  corepack enable yarn",
    "  yarn install",
    "",
    "If the `yarn` command still resolves to Yarn 1, run the commands through Corepack:",
    "  corepack yarn install",
    "  corepack yarn dev",
    "",
  ].join("\n");
}

function printToolsUsage() {
  console.error([
    "Usage: lilia-tools <command>",
    "",
    "Commands:",
    "  check-package-manager",
    "  sync-app-config",
    "  version-bump <patch|minor|major|x.y.z>",
    "  doctor [--json]",
    "  template-check [--json]",
    "  agent-debug [--json]",
    "  copy-assets [--force] [--json]",
    "  licenses [--project-root <path>] [--output <path>] [--cargo-manifest <path>]",
    "  migrate [--force] [--json]",
  ].join("\n"));
}

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}
