import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nativeBuildEnv, parsePort, pickBundleFile } from "@lilia/build";
import {
  bumpVersion,
  checkPackageManager,
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

  it("selects the newest supported bundle by platform priority", () => {
    const root = mkdtempSync(join(tmpdir(), "lilia-bundle-"));
    const msi = join(root, "app.msi");
    const exe = join(root, "app.exe");
    writeFileSync(exe, "exe");
    writeFileSync(msi, "msi");

    expect(pickBundleFile(root, "win32")).toBe(msi);
  });
});

function createProject() {
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
