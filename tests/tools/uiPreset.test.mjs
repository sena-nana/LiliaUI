// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  createUiPresetPlan,
  findModuleSpecifiers,
  inspectUiProject,
  rewriteModuleSpecifiers,
  runUiPreset,
} from "@lilia/tools/ui-preset";
import { createUiFixture, initializeGit, read, readJson, write } from "./uiFixture.mjs";

describe("UI preset tooling", () => {
  it.each([
    ["Markdown nested templates and fenced-code pattern", [
      'blocks.push(`<${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`);',
      "if (/^```/.test(line.trim())) return;",
    ].join("\n")],
    ["escaped quote and slash class", String.raw`const escaped = tag.replace(/["\\]/g, "\\$&");`],
    ["agent id punctuation class", "const encoded = value.replace(/[!'()*]/g, encode);"],
    ["quoted remote name pattern", "const remote = /remote ['\"]?origin['\"]? not/i;"],
  ])("scans imports after the %s used by LiliaGithub", (_name, expression) => {
    const source = [
      expression,
      'import { UiButton } from "@lilia/ui";',
      "",
    ].join("\n");

    expect(findModuleSpecifiers(source, "fixture.ts").map((item) => item.value))
      .toEqual(["@lilia/ui"]);
  });

  it("distinguishes escaped regular expressions from division while rewriting imports", () => {
    const source = String.raw`
const matcher = /[\/\\'"]+\/(?:foo|bar)/giu;
const ratio = total / divisor;
const normalized = 120 / 3 / ratio;
ratio /= scale;
export { UiButton } from "@lilia/ui";
`;

    const result = rewriteModuleSpecifiers(source, "fixture.ts", (specifier) =>
      specifier === "@lilia/ui" ? "./ui" : specifier);

    expect(result.changed).toBe(true);
    expect(result.edits).toHaveLength(1);
    expect(result.content).toContain("const ratio = total / divisor;");
    expect(result.content).toContain("const normalized = 120 / 3 / ratio;");
    expect(findModuleSpecifiers(result.content, "fixture.ts").map((item) => item.value))
      .toEqual(["./ui"]);
  });

  it("creates the complete stable Lilia facade and remains idempotent", async () => {
    const root = createUiFixture({ legacy: true });

    const first = await runUiPreset(root, "lilia", { commands: [] });
    const facade = read(root, "src/ui/index.ts");
    const repeated = await runUiPreset(root, "lilia", { commands: [] });

    expect(first.status).toBe("changed");
    expect(facade).toContain('export * from "@lilia/ui/layouts";');
    expect(facade).toContain('export * from "@lilia/ui/runtime";');
    expect(facade).toContain('export * from "@lilia/ui/diagnostics";');
    expect(repeated.status).toBe("unchanged");
    expect(repeated.changes).toHaveLength(0);
  });

  it("switches dependencies, config, facade, and styles as one idempotent plan", async () => {
    const root = createUiFixture();
    const commandRunner = async (command) => ({ id: command.id, code: 0 });
    const first = await runUiPreset(root, "nana", { commandRunner });

    expect(first.status).toBe("changed");
    expect(first.current).toMatchObject({ preset: "nana", source: "remote", revision: "abc123" });
    const manifest = readJson(root, "package.json");
    expect(manifest.dependencies["@lilia/ui"]).toBeUndefined();
    expect(manifest.dependencies["@lilia/nana-ui"]).toContain("workspace=@lilia/nana-ui&commit=abc123");
    expect(manifest.dependencies["@lilia/ui-contract"]).toContain("commit=abc123");
    expect(manifest.dependencies["@lilia/ui-foundation"]).toContain("commit=abc123");
    expect(readJson(root, "app.config.json").ui).toEqual({ preset: "nana", density: "comfortable" });
    expect(read(root, "src/ui/index.ts")).toContain("@lilia/nana-ui/shell");
    expect(read(root, "src/ui/styles.css")).toContain("@lilia/nana-ui/styles.css");

    const second = await runUiPreset(root, "nana", { commandRunner });
    expect(second.status).toBe("unchanged");
    expect(second.changes).toHaveLength(0);
  });

  it("keeps local/remote source independent from the selected preset", async () => {
    const root = createUiFixture({
      manifest: {
        resolutions: {
          "@lilia/ui": "portal:../LiliaUI/packages/ui",
          "@lilia/nana-ui": "github:sena-nana/LiliaUI#workspace=@lilia/nana-ui&commit=stale",
          "@lilia/ui-contract": "portal:../LiliaUI/packages/ui-contract",
          "@lilia/ui-foundation": "portal:../LiliaUI/packages/ui-foundation",
        },
      },
    });
    const before = await inspectUiProject(root);
    const plan = await createUiPresetPlan(before, "nana", { commands: [] });
    const packageChange = JSON.parse(plan.operations.find((item) => item.path === "package.json").after);

    expect(before.current).toMatchObject({ preset: "lilia", source: "local" });
    expect(packageChange.resolutions["@lilia/ui"]).toBeUndefined();
    expect(packageChange.resolutions["@lilia/nana-ui"]).toBe("portal:../LiliaUI/packages/nana-ui");
    expect(packageChange.dependencies["@lilia/nana-ui"]).toContain("commit=abc123");

    const switched = await runUiPreset(root, "nana", { commands: [] });
    expect(switched.current).toMatchObject({ preset: "nana", source: "local", revision: "abc123" });
    const restored = await runUiPreset(root, "lilia", { commands: [] });
    expect(restored.current).toMatchObject({ preset: "lilia", source: "local", revision: "abc123" });
    expect(readJson(root, "package.json").resolutions["@lilia/ui"])
      .toBe("portal:../LiliaUI/packages/ui");
  });

  it("ignores stale local overrides for an inactive Layer", async () => {
    const root = createUiFixture({
      manifest: { resolutions: { "@lilia/nana-ui": "portal:../LiliaUI/packages/nana-ui" } },
    });

    const report = await runUiPreset(root, "status");

    expect(report.status).toBe("ready");
    expect(report.current).toMatchObject({ preset: "lilia", source: "remote", revision: "abc123" });

    const switched = await runUiPreset(root, "nana", { commands: [] });
    expect(switched.current.source).toBe("remote");
    expect(readJson(root, "package.json").resolutions["@lilia/nana-ui"]).toBeUndefined();
  });

  it("supports dry-run and check without writing", async () => {
    const root = createUiFixture();
    const original = read(root, "package.json");

    const dryRun = await runUiPreset(root, "nana", { dryRun: true });
    const check = await runUiPreset(root, "nana", { check: true });

    expect(dryRun.status).toBe("planned");
    expect(check.status).toBe("changes_required");
    expect(dryRun.changes.map((item) => item.path)).toContain("package.json");
    expect(read(root, "package.json")).toBe(original);
  });

  it("detects dependency, commit, facade, and config drift", async () => {
    const root = createUiFixture({
      dependencies: {
        "@lilia/nana-ui": "github:sena-nana/LiliaUI#workspace=@lilia/nana-ui&commit=other",
      },
      appConfig: { ui: { preset: "nana", density: "comfortable" } },
    });
    const inspection = await inspectUiProject(root);

    expect(inspection.status).toBe("needs_attention");
    expect(inspection.drift.map((item) => item.id)).toEqual(expect.arrayContaining([
      "layer-dependency",
      "facade-preset",
      "workspace-revision",
    ]));
  });

  it("requires every remote UI package to pin the same immutable commit", async () => {
    const root = createUiFixture({
      dependencies: {
        "@lilia/ui": "github:sena-nana/LiliaUI#workspace=@lilia/ui&head=main",
      },
    });

    const inspection = await inspectUiProject(root);

    expect(inspection.current.revision).toBe("unpinned");
    expect(inspection.drift.some((item) => item.id === "workspace-revision")).toBe(true);
    expect(inspection.status).toBe("needs_attention");

    const report = await runUiPreset(root, "nana", { commands: [] });
    expect(report.status).toBe("blocked");
    expect(readJson(root, "package.json").dependencies["@lilia/ui"])
      .toContain("head=main");
  });

  it("repairs a mismatched shared package commit from the active Layer", async () => {
    const root = createUiFixture({
      dependencies: {
        "@lilia/ui-foundation": "github:sena-nana/LiliaUI#workspace=@lilia/ui-foundation&commit=old",
      },
    });

    const report = await runUiPreset(root, "lilia", { commands: [] });
    const manifest = readJson(root, "package.json");

    expect(report.status).toBe("changed");
    expect(report.current.revision).toBe("abc123");
    expect(manifest.dependencies["@lilia/ui-contract"]).toContain("commit=abc123");
    expect(manifest.dependencies["@lilia/ui-foundation"]).toContain("commit=abc123");
  });

  it("does not let managed facade metadata hide a missing app config preset", async () => {
    const root = createUiFixture();
    const appConfig = readJson(root, "app.config.json");
    delete appConfig.ui;
    write(root, "app.config.json", `${JSON.stringify(appConfig, null, 2)}\n`);

    const inspection = await inspectUiProject(root);

    expect(inspection.current).toMatchObject({ preset: "lilia", configured: "unknown", managed: "lilia" });
    expect(inspection.drift.some((item) => item.id === "config-preset")).toBe(true);
    expect(inspection.status).toBe("needs_attention");
  });

  it("refuses a preset-only switch while business code bypasses the facade", async () => {
    const root = createUiFixture({ main: 'import { UiButton } from "@lilia/ui";\n' });
    const original = read(root, "package.json");

    const status = await runUiPreset(root, "status", { check: true });
    const report = await runUiPreset(root, "nana", { commands: [] });

    expect(status.status).toBe("needs_attention");
    expect(status.drift.some((item) => item.id === "direct-layer-import")).toBe(true);
    expect(report.status).toBe("blocked");
    expect(report.blockers.some((item) => item.id === "direct-layer-import")).toBe(true);
    expect(read(root, "package.json")).toBe(original);
  });

  it("allows check and dry-run on a dirty repository but protects real writes", async () => {
    const root = createUiFixture();
    initializeGit(root);
    write(root, "notes.txt", "uncommitted\n");
    const original = read(root, "package.json");

    const check = await runUiPreset(root, "nana", { check: true, commands: [] });
    const dryRun = await runUiPreset(root, "nana", { dryRun: true, commands: [] });
    const blocked = await runUiPreset(root, "nana", { commands: [] });

    expect(check.status).toBe("changes_required");
    expect(dryRun.status).toBe("planned");
    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers.some((item) => item.id === "dirty-worktree")).toBe(true);
    expect(read(root, "package.json")).toBe(original);

    const forced = await runUiPreset(root, "nana", { force: true, commands: [] });
    expect(forced.status).toBe("changed");
  });
});
