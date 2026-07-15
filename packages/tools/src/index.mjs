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
import { fileURLToPath } from "node:url";
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
  const appConfig = readAppConfig(projectRoot);
  const profile = createTemplateProfile(options.profile);
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
    {
      id: "package-manager",
      ok: packageJson.packageManager === profile.packageManager,
      detail: `packageManager=${packageJson.packageManager ?? "missing"}`,
    },
    {
      id: "single-app-root",
      ok: packageJson.workspaces === undefined,
      detail: packageJson.workspaces === undefined ? "no workspaces field" : "workspaces field exists",
    },
    {
      id: "lilia-dependencies-present",
      ok: expectedDependencies.every((name) => packageJson.dependencies?.[name] !== undefined),
      detail: expectedDependencies
        .map((name) => `${name}=${packageJson.dependencies?.[name] ?? "missing"}`)
        .join(", "),
    },
    {
      id: "native-backdrop-permission",
      ok: nativeBackdropPermission !== undefined,
      detail: nativeBackdropPermission
        ? `permission=${nativeBackdropPermission}`
        : `expected one of ${profile.nativeBackdropPermissions.join(", ")}`,
    },
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
  ];
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
      const report = createTemplateReport(projectRoot);
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
      const report = createAgentDebugReport(projectRoot);
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

function createTemplateProfile(overrides = {}) {
  return {
    packageManager: "yarn@4.17.1+sha512.ccbfabf7d7b6b32075088be9386fb9a2e00bb6887ef07fa56effabc890a56d53da1ccc4128d62db245fcbd3961b236d75335bdf7d5320ed6eafb7588b7ad4697",
    expectedDependencies: ["@lilia/ui", "@lilia/config", "@lilia/tools", "@lilia/build"],
    nativeBackdropPermissions: ["lilia:default", "lilia:allow-set-window-backdrop"],
    importantFiles: [
      ["app.config.json", "single source for app name, product title, version, and identifiers"],
      ["src/main.ts", "minimal Vue bootstrap that mounts createLiliaApp"],
      ["src/app.config.ts", "runtime adapter from app config to @lilia/ui shell config"],
      ["src/app.ts", "createLiliaApp integration boundary"],
      ["src/routes.ts", "application route table"],
      ["src/commands.ts", "application command registration boundary"],
      ["src/features/home/HomePage.vue", "default business feature page"],
      ["scripts/agent-debug.mjs", "template-level Agent debug compatibility entry"],
      ["scripts/agent-debug-fallback.mjs", "temporary compatibility layer for older @lilia/tools installs"],
      ["node_modules/@lilia/ui/src/index.ts", "installed public UI package entry"],
      ["src-tauri/src/lib.rs", "Tauri command and plugin registration boundary"],
      ["tests/tooling.test.ts", "tooling and template-boundary regression tests"],
      ["docs/guide/development.md", "developer and agent orientation guide"],
    ],
    agentTargetFiles: {
      "src/features/home/HomePage.vue": [
        ["home.page"],
        ["home.header"],
        ["home.start-card"],
      ],
      "node_modules/@lilia/ui/src/layouts/AppShell.vue": [["shell.sidebar.resizer"]],
      "node_modules/@lilia/ui/src/components/TitleBar.vue": [
        ["titlebar"],
        ["titlebar.left-sidebar.toggle"],
      ],
      "node_modules/@lilia/ui/src/layouts/SecondaryPanel.vue": [
        ["sidebar.nav.overview", "sidebar.nav.${item.key}"],
      ],
      "node_modules/@lilia/ui/src/components/sidebar/SidebarFooter.vue": [
        ["sidebar.footer.settings", "sidebar.footer.${link.key}"],
        ["sidebar.footer.status"],
      ],
      "node_modules/@lilia/ui/src/layouts/SettingsSidebar.vue": [
        ["settings.sidebar.back"],
        ["settings.tab.appearance", "settings.tab.${tab.key}"],
        ["settings.tab.about", "settings.tab.${tab.key}"],
      ],
      "node_modules/@lilia/ui/src/pages/settings/AppearanceSection.vue": [
        ["settings.appearance.theme.dark"],
        ["settings.appearance.theme.light"],
        ["settings.appearance.corner.smooth"],
        ["settings.appearance.corner.round"],
        ["settings.appearance.corner-radius"],
        ["settings.appearance.backdrop.system"],
        ["settings.appearance.backdrop.mica"],
        ["settings.appearance.backdrop.acrylic"],
        ["settings.appearance.backdrop.solid"],
        ["settings.appearance.backdrop-target.sidebar"],
        ["settings.appearance.backdrop-target.main"],
        ["settings.appearance.titlebar-follow-sidebar"],
        ["settings.appearance.backdrop-opacity"],
      ],
      "node_modules/@lilia/ui/src/components/ContextMenuHost.vue": [["context-menu"]],
      "node_modules/@lilia/ui/src/components/ConfirmDialog.vue": [
        ["confirm-dialog.cancel"],
        ["confirm-dialog.confirm"],
      ],
    },
    boundaries: {
      includes: [
        "thin Tauri 2 + Vue 3 scaffold",
        "@lilia/ui powered theme, titlebar, context menu, shell, and settings UI",
        "@lilia/config, @lilia/tools, and @lilia/build powered shared project tooling",
        "tauri-plugin-lilia powered window-state persistence, native backdrop, and app metadata sync",
      ],
      excludes: [
        "application-specific business flows",
        "application-specific data models and persistence",
        "optional desktop features that are not enabled by this scaffold",
      ],
    },
    entrypoints: [
      { id: "install", command: "corepack yarn install", purpose: "install dependencies with the pinned Yarn line" },
      { id: "frontend", command: "yarn dev", purpose: "run the Vite frontend only" },
      { id: "desktop", command: "yarn tauri:dev", purpose: "run the Tauri desktop app with dynamic devUrl" },
      {
        id: "agent-debug",
        command: "yarn agent:debug --json",
        purpose: "inspect template readiness, shared Agent targets, and desktop replay prerequisites",
      },
      { id: "unit", command: "yarn test", purpose: "run Vitest regression tests" },
      { id: "build", command: "yarn build", purpose: "type-check and build frontend assets" },
      {
        id: "desktop-release-fast",
        command: "yarn tauri:build:no-bundle",
        purpose: "compile the release desktop app without generating installers",
      },
      {
        id: "rust",
        command: "cargo check --manifest-path src-tauri/Cargo.toml",
        purpose: "check the Tauri Rust side",
      },
      { id: "full", command: "yarn verify", purpose: "run the template's full verification gate" },
    ],
    ...overrides,
  };
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
