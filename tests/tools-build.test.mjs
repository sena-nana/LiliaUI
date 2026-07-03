// @vitest-environment node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

describe("@lilia/tools", () => {
  it("checks the pinned Yarn line from package metadata", () => {
    const root = createProject();

    expect(
      checkPackageManager(root, { npm_config_user_agent: "yarn/4.14.1 npm/? node/?" }).ok,
    ).toBe(true);
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
      runPrepare(root, { npm_config_user_agent: "yarn/4.14.1 npm/? node/?" }),
    ).not.toThrow();
  });
});

function createProject(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "lilia-tools-"));
  mkdirSync(join(root, "src-tauri"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({
      name: "lilia-test",
      version: "0.1.0",
      packageManager: "yarn@4.14.1",
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
