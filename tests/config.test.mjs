// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculateNextVersion,
  defineAppConfig,
  defineLiliaDocsConfig,
  defineLiliaViteConfig,
  syncFromAppConfig,
  validateAppConfig,
} from "@lilia/config";

describe("@lilia/config", () => {
  it("validates the shared app config contract", () => {
    expect(() => validateAppConfig(createAppConfig())).not.toThrow();
    expect(() => validateAppConfig({ ...createAppConfig(), productTitle: "" })).toThrow(
      /productTitle/,
    );
  });

  it("validates Nana UI, layout, and onboarding config", () => {
    const config = createAppConfig({
      ui: {
        preset: "nana",
        density: "comfortable",
        accent: "blue",
      },
      layout: {
        type: "nana-editor",
        sidebar: { collapsible: true },
      },
      onboarding: { enabled: true },
    });

    expect(defineAppConfig(config)).toBe(config);
    expect(() => validateAppConfig(config)).not.toThrow();
  });

  it.each([
    [{ ui: { preset: "consumer" } }, /ui\.preset/],
    [{ ui: { preset: "nana", density: "dense" } }, /ui\.density/],
    [{ ui: { preset: "nana", accent: "red" } }, /ui\.accent/],
    [{ ui: { preset: "nana", theme: "dark" } }, /ui\.theme/],
    [{ ui: { preset: "nana" }, layout: { type: "dashboard" } }, /layout\.type/],
    [
      { ui: { preset: "nana" }, layout: { type: "nana-editor", sidebar: {} } },
      /layout\.sidebar\.collapsible/,
    ],
    [{ onboarding: { enabled: "yes" } }, /onboarding\.enabled/],
    [{ onboarding: { enabled: true, skippable: true } }, /onboarding\.skippable/],
  ])("rejects unsupported app config values %#", (extension, expectedError) => {
    expect(() => validateAppConfig(createAppConfig(extension))).toThrow(expectedError);
  });

  it("requires Nana preset when a Nana page layout is configured", () => {
    expect(() => validateAppConfig(createAppConfig({
      ui: { preset: "lilia" },
      layout: { type: "nana-home" },
    }))).toThrow(/ui\.preset/);
  });

  it("syncs app config into package, Tauri config, and Cargo metadata", () => {
    const root = createProject();
    const config = createAppConfig({ version: "0.2.0", productTitle: "Synced App" });

    syncFromAppConfig(config, root);

    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    const tauri = JSON.parse(readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf-8"));
    const tauriMacos = JSON.parse(
      readFileSync(join(root, "src-tauri/tauri.macos.conf.json"), "utf-8"),
    );
    const cargo = readFileSync(join(root, "src-tauri/Cargo.toml"), "utf-8");

    expect(pkg.name).toBe(config.appName);
    expect(pkg.version).toBe(config.version);
    expect(tauri.productName).toBe(config.productTitle);
    expect(tauri.app.windows[0].title).toBe(config.productTitle);
    expect(tauriMacos.productName).toBe(config.productTitle);
    expect(tauriMacos.app.windows[0].title).toBe(config.productTitle);
    expect(cargo).toContain('version = "0.2.0"');
  });

  it("calculates semantic version bumps", () => {
    expect(calculateNextVersion("0.1.0", "patch")).toBe("0.1.1");
    expect(calculateNextVersion("0.1.9", "minor")).toBe("0.2.0");
    expect(calculateNextVersion("0.9.9", "major")).toBe("1.0.0");
    expect(calculateNextVersion("1.2.3", "1.2.4")).toBe("1.2.4");
    expect(() => calculateNextVersion("1.2.3", "1.2.2")).toThrow(/not greater than current/i);
  });

  it("creates reusable Vite and docs configs from app config", async () => {
    const root = createProject();
    writeFileSync(
      join(root, "app.config.json"),
      `${JSON.stringify(createAppConfig({ productTitle: "Config App" }), null, 2)}\n`,
    );

    const viteConfig = defineLiliaViteConfig({ projectRoot: root, envPrefix: "TEST_APP" });
    const resolved = await viteConfig({ command: "serve", mode: "test" });
    const htmlPlugin = resolved.plugins.find((plugin) => plugin.name === "lilia-app-config-html");

    expect(resolved.server.port).toBe(1420);
    expect(resolved.resolve.dedupe).toEqual(expect.arrayContaining([
      "vue",
      "vue-router",
      "@lucide/vue",
      "@tauri-apps/api",
      "vitest",
    ]));
    expect(resolved.optimizeDeps.exclude).toEqual(expect.arrayContaining(["@lilia/ui"]));
    expect(htmlPlugin.transformIndexHtml("%APP_PRODUCT_TITLE%")).toBe("Config App");

    const docsConfig = defineLiliaDocsConfig({ title: "Docs", description: "Reference" });
    expect(docsConfig.title).toBe("Docs");
    expect(docsConfig.description).toBe("Reference");
  });
});

function createProject() {
  const root = mkdtempSync(join(tmpdir(), "lilia-config-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "old", version: "0.1.0" }));
  writeFileSync(
    join(root, "app.config.json"),
    `${JSON.stringify(createAppConfig(), null, 2)}\n`,
  );
  const tauriDir = join(root, "src-tauri");
  mkdirSync(tauriDir, { recursive: true });
  writeFileSync(
    join(tauriDir, "tauri.conf.json"),
    JSON.stringify({
      productName: "Old",
      version: "0.1.0",
      identifier: "old",
      app: { windows: [{ label: "main", title: "Old" }] },
    }),
  );
  writeFileSync(
    join(tauriDir, "tauri.macos.conf.json"),
    JSON.stringify({
      productName: "Old",
      version: "0.1.0",
      identifier: "old",
      app: { windows: [{ label: "main", title: "Old", titleBarStyle: "Overlay" }] },
    }),
  );
  writeFileSync(join(tauriDir, "Cargo.toml"), '[package]\nversion = "0.1.0"\n');
  return root;
}

function createAppConfig(overrides = {}) {
  return {
    appName: "lilia-test",
    productTitle: "Lilia Test",
    version: "0.1.0",
    identifier: "com.lilia.test",
    storageKeyPrefix: "lilia-test",
    ...overrides,
  };
}
