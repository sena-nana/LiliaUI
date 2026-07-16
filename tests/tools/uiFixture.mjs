import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export function createUiFixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), "lilia-ui-tools-"));
  const revision = options.revision ?? "abc123";
  const remote = (name) => `github:sena-nana/LiliaUI#workspace=${name}&commit=${revision}`;
  const dependencies = {
    "@lilia/config": remote("@lilia/config"),
    "@lilia/tools": remote("@lilia/tools"),
    "@lilia/ui": remote("@lilia/ui"),
    "@lilia/ui-contract": remote("@lilia/ui-contract"),
    "@lilia/ui-foundation": remote("@lilia/ui-foundation"),
    ...options.dependencies,
  };
  const manifest = {
    name: "fixture-app",
    private: true,
    scripts: { typecheck: "fixture-typecheck" },
    dependencies,
    ...options.manifest,
  };
  write(root, "package.json", `${JSON.stringify(manifest, null, 2)}\n`);
  write(root, "app.config.json", `${JSON.stringify({
    appName: "fixture-app",
    productTitle: "Fixture App",
    version: "0.1.0",
    identifier: "dev.lilia.fixture",
    storageKeyPrefix: "fixture",
    ui: { preset: "lilia", density: "compact" },
    ...options.appConfig,
  }, null, 2)}\n`);
  if (!options.legacy) {
    write(root, "src/ui/index.ts", [
      'export * from "@lilia/ui";',
      'export * from "@lilia/ui/shell";',
      "",
    ].join("\n"));
    write(root, "src/ui/contract.ts", 'export * from "@lilia/ui-contract";\n');
    write(root, "src/ui/styles.css", '@import "@lilia/ui/styles.css";\n');
    write(root, "src/ui/preset.ts", [
      "// @lilia/ui-preset:start",
      'export { liliaPresetAdapter as appUIPreset } from "@lilia/ui/preset";',
      'export const appUIPresetId = "lilia" as const;',
      'export const appUIDefaultDensity = "compact" as const;',
      "// @lilia/ui-preset:end",
      "",
    ].join("\n"));
  }
  write(root, "src/main.ts", options.main ?? 'import "./ui/styles.css";\n');
  return root;
}

export function write(root, path, content) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

export function read(root, path) {
  return readFileSync(join(root, path), "utf8");
}

export function readJson(root, path) {
  return JSON.parse(read(root, path));
}

export function initializeGit(root) {
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Fixture"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
}
