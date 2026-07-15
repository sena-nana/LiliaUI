// @vitest-environment node
import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTauriDevBuildConfig,
  nativeBuildEnv,
  parsePort,
  pickBundleFile,
  resolveToolCommand,
  runPrepare,
  viteDevArgs,
} from "@lilia/build";
import {
  bumpVersion,
  checkPackageManager,
  createAgentDebugReport,
  copyLiliaAssets,
  createTemplateReport,
} from "@lilia/tools";
import {
  createDesktopShortcut,
  createTauriInstallPlan,
  linuxDesktopEntry,
  selectCargoAppLayout,
  tauriInstallBuildArgs,
  windowsShortcutCommand,
} from "../packages/build/src/tauriInstall.mjs";

describe("@lilia/tools", () => {
  it("checks the pinned Yarn line from package metadata", () => {
    const root = createProject();

    expect(
      checkPackageManager(root, { npm_config_user_agent: "yarn/4.17.1 npm/? node/?" }).ok,
    ).toBe(true);
    expect(
      checkPackageManager(root, { npm_config_user_agent: "yarn/4.14.1 npm/? node/?" }).ok,
    ).toBe(false);
    expect(
      checkPackageManager(root, { npm_config_user_agent: "npm/11.0.0 node/?" }).ok,
    ).toBe(false);
  });

  it("bumps versions through the shared config synchronizer", () => {
    const root = createProject();

    expect(bumpVersion("minor", root)).toEqual({ from: "0.1.0", to: "0.2.0" });

    const config = JSON.parse(readFileSync(join(root, "app.config.json"), "utf-8"));
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    expect(config.version).toBe("0.2.0");
    expect(pkg.version).toBe("0.2.0");
  });

  it("copies default icons and web font assets into a scaffold", () => {
    const root = createProject();
    const copied = copyLiliaAssets(root);

    expect(copied.length).toBeGreaterThan(0);
    expect(readFileSync(join(root, "src-tauri/icons/icon.png")).byteLength).toBeGreaterThan(0);
    expect(readFileSync(join(root, "public/fonts/noto-sans-sc-chinese-simplified-400-normal.woff2")).byteLength).toBeGreaterThan(0);
  });

  it("reports template readiness from configurable boundary files", () => {
    const root = createProject();
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/main.ts"), "");

    const report = createTemplateReport(root, {
      profile: {
        expectedDependencies: ["@lilia/ui"],
        importantFiles: [["src/main.ts", "entry"]],
        agentTargetFiles: {},
      },
    });

    expect(report.status).toBe("ready");
    expect(report.checks.every((check) => check.ok)).toBe(true);
  });

  it("checks only Lilia package boundaries for shared dependencies", () => {
    const root = createProject({
      dependencies: {
        "@lilia/build": "workspace:*",
        "@lilia/config": "workspace:*",
        "@lilia/tools": "workspace:*",
        "@lilia/ui": "workspace:*",
      },
    });
    mkdirSync(join(root, "src", "features", "home"), { recursive: true });
    mkdirSync(join(root, "tests"), { recursive: true });
    mkdirSync(join(root, "docs", "guide"), { recursive: true });
    writeFileSync(join(root, "src/main.ts"), "");
    writeFileSync(join(root, "src/app.config.ts"), "");
    writeFileSync(join(root, "src/app.ts"), "");
    writeFileSync(join(root, "src/routes.ts"), "");
    writeFileSync(join(root, "src/commands.ts"), "");
    writeFileSync(join(root, "src/features/home/HomePage.vue"), "home.page home.header home.start-card");
    writeFileSync(join(root, "tests/tooling.test.ts"), "");
    writeFileSync(join(root, "docs/guide/development.md"), "");

    const report = createTemplateReport(root, {
      profile: {
        importantFiles: [
          ["src/main.ts", "entry"],
          ["src/app.config.ts", "config"],
          ["src/app.ts", "app"],
          ["src/routes.ts", "routes"],
          ["src/commands.ts", "commands"],
          ["src/features/home/HomePage.vue", "home"],
          ["tests/tooling.test.ts", "tests"],
          ["docs/guide/development.md", "docs"],
        ],
        agentTargetFiles: {
          "src/features/home/HomePage.vue": [["home.page"], ["home.header"], ["home.start-card"]],
        },
      },
    });

    const dependencyCheck = report.checks.find((check) => check.id === "lilia-dependencies-present");
    expect(dependencyCheck.ok).toBe(true);
    expect(dependencyCheck.detail).not.toContain("vue=");
    expect(dependencyCheck.detail).not.toContain("vite=");
  });

  it("requires a native backdrop permission in the default Tauri capability", () => {
    const root = createProject();
    const capabilityPath = join(root, "src-tauri", "capabilities", "default.json");
    const profile = {
      expectedDependencies: ["@lilia/ui"],
      importantFiles: [],
      agentTargetFiles: {},
    };

    writeFileSync(capabilityPath, `${JSON.stringify({ permissions: ["core:default"] })}\n`);
    const missing = createTemplateReport(root, { profile });
    expect(missing.checks.find((check) => check.id === "native-backdrop-permission")?.ok)
      .toBe(false);
    expect(missing.status).toBe("needs_attention");

    for (const permission of ["lilia:default", "lilia:allow-set-window-backdrop"]) {
      writeFileSync(capabilityPath, `${JSON.stringify({ permissions: [permission] })}\n`);
      const ready = createTemplateReport(root, { profile });
      expect(ready.checks.find((check) => check.id === "native-backdrop-permission")?.ok)
        .toBe(true);
      expect(ready.status).toBe("ready");
    }
  });

  it("reports Agent debug readiness without requiring desktop replay tools", () => {
    const root = createProject();
    const report = createAgentDebugReport(root, {
      profile: {
        expectedDependencies: ["@lilia/ui"],
        importantFiles: [],
        agentTargetFiles: {},
      },
    });

    expect(report.status).toBe("ready");
    expect(report.mode).toBe("agent-debug-readiness");
    expect(report.desktopReplay.requiredForReadiness).toBe(false);
    expect(report.runtimeTools.some((tool) => tool.id === "tauri-driver")).toBe(true);
    expect(report.template.entrypoints.some((entry) => entry.id === "agent-debug")).toBe(true);
  });
});

describe("@lilia/build", () => {
  it("parses dev ports and appends native CPU Rust flags", () => {
    expect(parsePort("34120")).toBe(34120);
    expect(parsePort("bad")).toBe(1420);
    expect(nativeBuildEnv({ RUSTFLAGS: "-C debuginfo=0" }).RUSTFLAGS).toBe(
      "-C debuginfo=0 -C target-cpu=native",
    );
    expect(nativeBuildEnv({ RUSTFLAGS: "-C target-cpu=x86-64-v3" }).RUSTFLAGS).toBe(
      "-C target-cpu=x86-64-v3",
    );
  });

  it("keeps Tauri devUrl and Vite dev server on the same dynamic port", () => {
    const root = createProject();

    expect(createTauriDevBuildConfig(34120)).toEqual({
      devUrl: "http://localhost:34120",
      beforeDevCommand: "yarn dev --host localhost --port 34120 --strictPort",
    });
    expect(
      viteDevArgs(root, [], {
        LILIA_TEST_DEV_PORT: "34120",
        LILIA_TEST_DEV_STRICT_PORT: "1",
      }),
    ).toEqual(["vite", "--host", "localhost", "--port", "34120", "--strictPort"]);
    expect(
      viteDevArgs(root, ["--port", "5173"], {
        LILIA_TEST_DEV_PORT: "34120",
        LILIA_TEST_DEV_STRICT_PORT: "1",
      }),
    ).toEqual(["vite", "--port", "5173"]);
  });

  it("selects the newest supported bundle by platform priority", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-bundle-"));
    const msi = join(root, "app.msi");
    const exe = join(root, "app.exe");
    writeFileSync(exe, "exe");
    writeFileSync(msi, "msi");

    expect(pickBundleFile(root, "win32")).toBe(msi);
  });

  it("resolves shared build tools from @lilia/build dependencies", () => {
    const tools = [
      ["vite", "vite"],
      ["vitepress", "vitepress"],
      ["vitest", "vitest"],
      ["vue-tsc", "vue-tsc"],
      ["@tauri-apps/cli", "tauri"],
    ];

    for (const [packageName, binName] of tools) {
      const command = resolveToolCommand(packageName, binName, ["--version"]);
      expect(command.command).toBe(process.execPath);
      expect(command.args[0]).toContain("node_modules");
      expect(command.args.at(-1)).toBe("--version");
    }
  });

  it("allows custom projects without app.config.json to reuse build tooling", () => {
    const root = createProject();
    rmSync(join(root, "app.config.json"));

    expect(() =>
      runPrepare(root, { npm_config_user_agent: "yarn/4.17.1 npm/? node/?" }),
    ).not.toThrow();
  });

  it("plans native application builds without installer bundles", () => {
    expect(tauriInstallBuildArgs("win32")).toEqual(["build", "--no-bundle"]);
    expect(tauriInstallBuildArgs("linux", "desktop")).toEqual([
      "--cwd",
      "desktop",
      "build",
      "--no-bundle",
    ]);
    expect(tauriInstallBuildArgs("darwin")).toEqual(["build", "--bundles", "app"]);
    expect(() => tauriInstallBuildArgs("freebsd")).toThrow("Unsupported platform");
  });

  it("locates the app binary from exact Cargo metadata", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-cargo-layout-"));
    const manifest = join(root, "src-tauri", "Cargo.toml");
    const targetDirectory = join(root, "custom-target");
    mkdirSync(join(root, "src-tauri"), { recursive: true });
    writeFileSync(manifest, "[package]\nname='app'\n");
    const metadata = {
      target_directory: targetDirectory,
      packages: [
        cargoPackage(join(root, "other", "Cargo.toml"), [cargoTarget("sidecar")]),
        {
          ...cargoPackage(manifest, [cargoTarget("first"), cargoTarget("desktop")]),
          default_run: "desktop",
        },
      ],
    };

    expect(selectCargoAppLayout(metadata, manifest)).toEqual({
      binName: "desktop",
      targetDirectory,
    });
    expect(() =>
      selectCargoAppLayout({
        ...metadata,
        packages: [cargoPackage(manifest, [cargoTarget("one"), cargoTarget("two")])],
      }, manifest),
    ).toThrow("set package.default-run");
  });

  it("derives platform artifacts and desktop shortcut targets", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-install-plan-"));
    const desktop = join(root, "Desktop");
    const targetDirectory = join(root, "target");
    const common = {
      projectRoot: root,
      appConfig: createAppConfig(),
      build: { command: process.execPath, argsPrefix: ["/tools/tauri.js"] },
      cargoLayout: { binName: "lilia_test", targetDirectory },
      desktopDir: desktop,
    };

    const windows = createTauriInstallPlan({ ...common, platform: "win32" });
    expect(windows.build.args.slice(-2)).toEqual(["build", "--no-bundle"]);
    expect(windows.artifact.path).toBe(join(targetDirectory, "release", "lilia_test.exe"));
    expect(windows.shortcut).toEqual({
      kind: "windows-lnk",
      path: join(desktop, "Lilia Test.lnk"),
      target: windows.artifact.path,
    });

    const mac = createTauriInstallPlan({ ...common, platform: "darwin" });
    expect(mac.build.args.slice(-3)).toEqual(["build", "--bundles", "app"]);
    expect(mac.artifact.path).toBe(
      join(targetDirectory, "release", "bundle", "macos", "Lilia Test.app"),
    );
    expect(mac.shortcut.kind).toBe("macos-app-symlink");

    const linux = createTauriInstallPlan({ ...common, platform: "linux" });
    expect(linux.artifact.path).toBe(join(targetDirectory, "release", "lilia_test"));
    expect(linux.shortcut.path).toBe(join(desktop, "Lilia Test.desktop"));
  });

  it("passes Windows shortcut paths outside the PowerShell source", () => {
    const plan = shortcutPlan(
      "win32",
      "windows-lnk",
      "/Users/A User/Desktop/App.lnk",
      "/repo $x/app.exe",
    );
    const command = windowsShortcutCommand(plan, createAppConfig(), { SystemRoot: "C:\\Windows" });

    expect(command.command).toBe("powershell.exe");
    expect(command.args.join(" ")).not.toContain(plan.artifact.path);
    expect(command.env).toMatchObject({
      LILIA_SHORTCUT_PATH: plan.shortcut.path,
      LILIA_SHORTCUT_TARGET: plan.artifact.path,
      LILIA_SHORTCUT_WORKDIR: "/repo $x",
    });
  });

  it("refreshes macOS symlinks without replacing real desktop items", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-mac-shortcut-"));
    const artifact = join(root, "target", "Lilia Test.app");
    const shortcut = join(root, "Desktop", "Lilia Test.app");
    mkdirSync(artifact, { recursive: true });
    mkdirSync(join(root, "Desktop"));
    const plan = shortcutPlan("darwin", "macos-app-symlink", shortcut, artifact, "app");

    createDesktopShortcut(plan, createAppConfig());
    expect(lstatSync(shortcut).isSymbolicLink()).toBe(true);
    expect(readlinkSync(shortcut)).toBe(artifact);
    createDesktopShortcut(plan, createAppConfig());
    expect(readlinkSync(shortcut)).toBe(artifact);

    unlinkSync(shortcut);
    symlinkSync(join(root, "old-repo", "Lilia Test.app"), shortcut, "dir");
    createDesktopShortcut(plan, createAppConfig());
    expect(readlinkSync(shortcut)).toBe(artifact);

    unlinkSync(shortcut);
    mkdirSync(shortcut);
    expect(() => createDesktopShortcut(plan, createAppConfig())).toThrow(
      "Refusing to replace non-symlink desktop item",
    );
  });

  it("writes an executable Linux desktop entry with escaped Exec fields", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-linux-shortcut-"));
    const artifact = join(root, "release", "app %$`\\name");
    const shortcut = join(root, "Desktop", "Lilia Test.desktop");
    const iconPath = join(root, "icon.png");
    mkdirSync(join(root, "release"), { recursive: true });
    mkdirSync(join(root, "Desktop"));
    writeFileSync(artifact, "binary");
    writeFileSync(iconPath, "icon");
    const plan = {
      ...shortcutPlan("linux", "linux-desktop-entry", shortcut, artifact),
      iconPath,
    };

    createDesktopShortcut(plan, createAppConfig());
    const entry = readFileSync(shortcut, "utf-8");
    expect(entry).toBe(linuxDesktopEntry(plan, createAppConfig()));
    expect(entry).toContain("app %%");
    expect(entry).toContain("\\\\$");
    expect(entry).toContain("\\\\`");
    expect(entry).toContain(`Icon=${iconPath}`);
    expect(lstatSync(shortcut).mode & 0o777).toBe(0o755);

    const protectedFile = join(root, "protected.txt");
    writeFileSync(protectedFile, "keep");
    unlinkSync(shortcut);
    symlinkSync(protectedFile, shortcut);
    expect(() => createDesktopShortcut(plan, createAppConfig())).toThrow(
      "Refusing to replace non-file desktop item",
    );
    expect(readFileSync(protectedFile, "utf-8")).toBe("keep");
    expect(() => linuxDesktopEntry({
      ...plan,
      artifact: { ...plan.artifact, path: "/repo/bad=name" },
    }, createAppConfig())).toThrow("unsupported characters");
  });
});

function cargoTarget(name) {
  return { name, kind: ["bin"] };
}

function cargoPackage(manifestPath, targets) {
  return { manifest_path: manifestPath, default_run: null, targets };
}

function shortcutPlan(platform, kind, shortcutPath, artifactPath, artifactKind = "executable") {
  return {
    platform,
    artifact: { kind: artifactKind, path: artifactPath },
    shortcut: { kind, path: shortcutPath, target: artifactPath },
  };
}

function createProject(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "lilia-tools-"));
  mkdirSync(join(root, "src-tauri", "capabilities"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({
      name: "lilia-test",
      version: "0.1.0",
      packageManager: "yarn@4.17.1+sha512.ccbfabf7d7b6b32075088be9386fb9a2e00bb6887ef07fa56effabc890a56d53da1ccc4128d62db245fcbd3961b236d75335bdf7d5320ed6eafb7588b7ad4697",
      dependencies: {
        "@lilia/ui": "workspace:*",
        ...(overrides.dependencies ?? {}),
      },
    }, null, 2)}\n`,
  );
  writeFileSync(join(root, "app.config.json"), `${JSON.stringify(createAppConfig(), null, 2)}\n`);
  writeFileSync(
    join(root, "src-tauri/tauri.conf.json"),
    JSON.stringify({
      productName: "Old",
      version: "0.1.0",
      identifier: "old",
      app: { windows: [{ label: "main", title: "Old" }] },
    }),
  );
  writeFileSync(join(root, "src-tauri/Cargo.toml"), '[package]\nversion = "0.1.0"\n');
  writeFileSync(
    join(root, "src-tauri/capabilities/default.json"),
    `${JSON.stringify({ permissions: ["lilia:default"] }, null, 2)}\n`,
  );
  return root;
}

function createAppConfig() {
  return {
    appName: "lilia-test",
    productTitle: "Lilia Test",
    version: "0.1.0",
    identifier: "com.lilia.test",
    storageKeyPrefix: "lilia-test",
    shell: {
      homeTitle: "Home",
      homeDescription: "Ready",
      workspaceSectionTitle: "Navigation",
      statusLabel: "Ready",
      statusTitle: "Ready",
      settingsDescription: "Settings",
    },
  };
}
