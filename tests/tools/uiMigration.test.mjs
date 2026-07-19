// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc";
import { describe, expect, it } from "vitest";
import {
  inspectUiMigration,
  runUiMigration,
} from "@lilia/tools/ui-migrate";
import { UI_LAYER_SUBPATHS } from "@lilia/tools/ui-preset";
import { createUiFixture, read, write } from "./uiFixture.mjs";

describe("UI migration tooling", () => {
  it("keeps the Lilia migration allowlist aligned with the published package exports", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "packages/ui/package.json"), "utf8"));
    const publishedSubpaths = Object.keys(manifest.exports).map((subpath) =>
      subpath === "." ? "" : subpath.slice(1));

    expect(new Set(UI_LAYER_SUBPATHS.lilia)).toEqual(new Set(publishedSubpaths));
  });

  it("keeps the Nana migration allowlist aligned with the published package exports", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "packages/nana-ui/package.json"), "utf8"));
    const publishedSubpaths = Object.keys(manifest.exports).map((subpath) =>
      subpath === "." ? "" : subpath.slice(1));

    expect(new Set(UI_LAYER_SUBPATHS.nana)).toEqual(new Set(publishedSubpaths));
  });

  it("accepts Lilia stable barrels and explicit compatibility subpaths", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import { LiliaWorkspace } from "@lilia/ui/layouts";',
        'import { installNativeAppearance } from "@lilia/ui/runtime";',
        'import { configurePerfDiagnostics } from "@lilia/ui/diagnostics";',
        'import ContextMenuHost from "@lilia/ui/components/ContextMenuHost";',
        'import { useContextMenu } from "@lilia/ui/composables/useContextMenu";',
        'import { calendarLevel } from "@lilia/ui/utils/calendarHeatmap";',
        'import "@lilia/ui/styles/page.css";',
        "",
      ].join("\n"),
    });

    const inspection = await inspectUiMigration(root, { preset: "lilia" });

    expect(inspection.contractIncompatibilities).toHaveLength(0);
    expect(inspection.blockers).toHaveLength(0);
  });

  it("reports the removed Router-owning Shell contract", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import { LiliaDesktopShell } from "@lilia/ui/shell";',
        "export const shell = LiliaDesktopShell;",
        "",
      ].join("\n"),
    });
    const inspection = await inspectUiMigration(root);
    expect(inspection.informationArchitectureReview).toContainEqual(expect.objectContaining({
      path: "src/main.ts",
      detail: expect.stringContaining("Router-owning Shell API was removed"),
    }));
    expect(inspection.legacyShellMigrations).toContainEqual(expect.objectContaining({
      path: "src/main.ts",
      layer: "lilia",
      kind: "lilia-desktop-shell",
      strategy: "redirect-import",
      automatic: true,
      scaffoldPath: "src/ui/LegacyShell.vue",
    }));
  });

  it("reports NanaAppShell calls that still pass removed navigation and context props", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import { NanaAppShell } from "@lilia/nana-ui/shell";',
        'export const props = { navigation: [], contextVisible: true };',
        'export const shell = NanaAppShell;',
        "",
      ].join("\n"),
    });
    const inspection = await inspectUiMigration(root, { preset: "nana" });
    expect(inspection.informationArchitectureReview).toContainEqual(expect.objectContaining({
      path: "src/main.ts",
      detail: expect.stringContaining("Router-owning Shell API was removed"),
    }));
    expect(inspection.legacyShellMigrations).toContainEqual(expect.objectContaining({
      layer: "nana",
      kind: "nana-app-shell-props",
      automatic: true,
    }));
  });

  it("applies a managed Lilia workspace scaffold and redirects old Shell imports", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import { LiliaDesktopShell, LiliaSidebarFrame } from "@lilia/ui/shell";',
        "export { LiliaDesktopShell, LiliaSidebarFrame };",
        "",
      ].join("\n"),
    });

    const report = await runUiMigration(root, { preset: "lilia", commands: [] });

    expect(report.status).toBe("changed");
    expect(report.migration.legacyShellMigrations).toContainEqual(expect.objectContaining({
      kind: "lilia-desktop-shell",
    }));
    expect(read(root, "src/main.ts")).toContain('from "./ui/legacy-shell"');
    expect(read(root, "src/ui/LegacyShell.vue")).toContain("<LiliaWorkspace");
    expect(read(root, "src/ui/LegacyShell.vue")).toContain("<RouterView />");
    expect(read(root, "src/ui/legacy-shell.ts")).toContain("default as LiliaDesktopShell");
    expectSfcToCompile(read(root, "src/ui/LegacyShell.vue"));

    const repeated = await runUiMigration(root, { preset: "lilia", commands: [] });
    expect(repeated.status).toBe("unchanged");
    expect(repeated.changes).toHaveLength(0);
  });

  it("applies a Nana scaffold while preserving legacy navigation props, events, and slots", async () => {
    const root = createUiFixture({
      legacy: true,
      dependencies: {
        "@lilia/ui": undefined,
        "@lilia/nana-ui": "github:sena-nana/LiliaUI#workspace=@lilia/nana-ui&commit=abc123",
      },
      appConfig: { ui: { preset: "nana", density: "comfortable" } },
      main: [
        'import { NanaDesktopShell } from "@lilia/nana-ui/shell";',
        "export const props = { navigation: [], navigationSections: [], contextVisible: true };",
        "export const shell = NanaDesktopShell;",
        "",
      ].join("\n"),
    });

    const report = await runUiMigration(root, { preset: "nana", commands: [] });
    const scaffold = read(root, "src/ui/LegacyShell.vue");

    expect(report.status).toBe("changed");
    expect(read(root, "src/main.ts")).toContain('from "./ui/legacy-shell"');
    expect(scaffold).toContain(":items=\"navigation\"");
    expect(scaffold).toContain("@update:mode=\"emit('update:sidebarMode', $event)\"");
    expect(scaffold).toContain('<slot name="context" />');
    expect(scaffold).toContain("<RouterView />");
    expectSfcToCompile(scaffold);
  });

  it("does not classify the current Router-free NanaAppShell contract", async () => {
    const root = createUiFixture({
      legacy: true,
      dependencies: {
        "@lilia/ui": undefined,
        "@lilia/nana-ui": "github:sena-nana/LiliaUI#workspace=@lilia/nana-ui&commit=abc123",
      },
      appConfig: { ui: { preset: "nana", density: "comfortable" } },
      main: [
        'import { NanaAppShell } from "@lilia/nana-ui/shell";',
        'export const props = { title: "Current", agentId: "current.shell" };',
        "export const shell = NanaAppShell;",
        "",
      ].join("\n"),
    });

    const inspection = await inspectUiMigration(root, { preset: "nana" });

    expect(inspection.legacyShellMigrations).toHaveLength(0);
  });

  it("replaces a structurally known copied LegacyAppShell but blocks customized copies", async () => {
    const knownRoot = createUiFixture();
    write(knownRoot, "src/layouts/LegacyAppShell.vue", knownLegacyAppShellSource());
    const migrated = await runUiMigration(knownRoot, { preset: "lilia", commands: [] });

    expect(migrated.status).toBe("changed");
    expect(read(knownRoot, "src/layouts/LegacyAppShell.vue")).toContain(
      'from "../ui"',
    );
    expect(read(knownRoot, "src/layouts/LegacyAppShell.vue")).toContain("<LiliaWorkspace");

    const customRoot = createUiFixture();
    const custom = [
      '<script setup lang="ts">',
      'import { RouterView } from "vue-router";',
      'import { useShellSidebar } from "@lilia/ui/composables/useShellSidebar";',
      "</script>",
      '<template><main class="shell__main"><RouterView /></main></template>',
      "",
    ].join("\n");
    write(customRoot, "src/layouts/LegacyAppShell.vue", custom);

    const blocked = await runUiMigration(customRoot, { preset: "lilia", commands: [] });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers.some((item) => item.id === "legacy-shell-customization")).toBe(true);
    expect(read(customRoot, "src/layouts/LegacyAppShell.vue")).toBe(custom);
  });

  it("fills missing Contract and Foundation declarations from the selected Layer source", async () => {
    const root = createUiFixture({
      dependencies: {
        "@lilia/ui-contract": undefined,
        "@lilia/ui-foundation": undefined,
      },
    });

    const before = await inspectUiMigration(root, { preset: "lilia" });
    expect(before.project.drift.filter((item) => item.id === "shared-dependency")).toHaveLength(2);

    const report = await runUiMigration(root, { preset: "lilia", commands: [] });
    const manifest = JSON.parse(read(root, "package.json"));

    expect(report.status).toBe("changed");
    expect(manifest.dependencies["@lilia/ui-contract"])
      .toBe("github:sena-nana/LiliaUI#workspace=@lilia/ui-contract&commit=abc123");
    expect(manifest.dependencies["@lilia/ui-foundation"])
      .toBe("github:sena-nana/LiliaUI#workspace=@lilia/ui-foundation&commit=abc123");
    expect(manifest.devDependencies?.["@lilia/ui-contract"]).toBeUndefined();
  });

  it("protects customized managed scaffold paths and rolls back newly created scaffolds", async () => {
    const conflictRoot = createUiFixture({
      main: [
        'import { LiliaDesktopShell } from "@lilia/ui/shell";',
        "export const shell = LiliaDesktopShell;",
        "",
      ].join("\n"),
    });
    write(conflictRoot, "src/ui/LegacyShell.vue", "<template><main>custom</main></template>\n");

    const conflict = await runUiMigration(conflictRoot, { preset: "lilia", commands: [] });
    expect(conflict.status).toBe("blocked");
    expect(conflict.blockers.some((item) => item.id === "legacy-shell-scaffold-conflict")).toBe(true);

    const rollbackRoot = createUiFixture({
      legacy: true,
      main: [
        'import { LiliaDesktopShell } from "@lilia/ui/shell";',
        "export const shell = LiliaDesktopShell;",
        "",
      ].join("\n"),
    });
    const rolledBack = await runUiMigration(rollbackRoot, {
      preset: "lilia",
      commands: [{ id: "verify", command: "unused", args: [] }],
      commandRunner: async () => { throw new Error("verification failed"); },
    });

    expect(rolledBack.status).toBe("rolled_back");
    expect(rolledBack.recovery.restored).toBe(true);
    expect(existsSync(join(rollbackRoot, "src/ui/LegacyShell.vue"))).toBe(false);
    expect(existsSync(join(rollbackRoot, "src/ui/legacy-shell.ts"))).toBe(false);
  });

  it("routes known imports through a generated facade without rewriting business behavior", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import "@lilia/ui/styles.css";',
        'import { LiliaDesktopShell } from "@lilia/ui/shell";',
        "export const shell = LiliaDesktopShell;",
        "",
      ].join("\n"),
    });
    write(root, "src/features/editor/EditorPage.vue", [
      "<script setup lang=\"ts\">",
      'import { UiButton } from "@lilia/ui";',
      "const businessValue = 42;",
      "</script>",
      "<template><UiButton>{{ businessValue }}</UiButton></template>",
      "",
    ].join("\n"));

    const inspection = await inspectUiMigration(root);
    expect(inspection.safeChanges.map((item) => item.path)).toEqual(expect.arrayContaining([
      "src/main.ts",
      "src/features/editor/EditorPage.vue",
    ]));
    const originalManifest = read(root, "package.json");
    const check = await runUiMigration(root, { check: true });
    expect(check.status).toBe("needs_attention");
    expect(read(root, "package.json")).toBe(originalManifest);

    const report = await runUiMigration(root, {
      preset: "nana",
      commands: [],
      commandRunner: async () => ({ code: 0 }),
    });
    expect(report.status).toBe("changed");
    expect(read(root, "src/main.ts")).toContain('import "./ui/styles.css"');
    expect(read(root, "src/features/editor/EditorPage.vue")).toContain('from "../../ui"');
    expect(read(root, "src/features/editor/EditorPage.vue")).toContain("const businessValue = 42");
    expect(read(root, "src/ui/index.ts")).toContain("@lilia/nana-ui");

    const repeated = await runUiMigration(root, { preset: "nana", commands: [] });
    expect(repeated.status).toBe("unchanged");
    expect(repeated.changes).toHaveLength(0);
  });

  it("finds and migrates static dynamic imports and Vue style entries", async () => {
    const root = createUiFixture({
      legacy: true,
      main: "export const loadUi = () => import(`@lilia/ui`);\n",
    });
    write(root, "src/features/profile/ProfilePage.vue", [
      '<script setup lang="ts">const ready = true;</script>',
      "<template><main v-if=\"ready\" /></template>",
      '<style src="@lilia/ui/styles.css"></style>',
      "",
    ].join("\n"));

    const before = await inspectUiMigration(root, { preset: "lilia" });
    expect(new Set(before.directImports.map((item) => item.path))).toEqual(new Set([
      "src/features/profile/ProfilePage.vue",
      "src/main.ts",
    ]));

    const report = await runUiMigration(root, { preset: "lilia", commands: [] });
    const after = await inspectUiMigration(root, { preset: "lilia" });
    expect(report.status).toBe("changed");
    expect(after.directImports).toHaveLength(0);
    expect(read(root, "src/main.ts")).toContain("import(`./ui`)");
    expect(read(root, "src/features/profile/ProfilePage.vue"))
      .toContain('src="../../ui/styles.css"');
  });

  it("stops safely when an import cannot be parsed", async () => {
    const root = createUiFixture({ legacy: true, main: 'import { UiButton } from "@lilia/ui;\n' });
    const original = read(root, "package.json");

    const report = await runUiMigration(root, { preset: "nana", commands: [] });

    expect(report.status).toBe("blocked");
    expect(report.blockers.some((item) => item.id === "parse-error")).toBe(true);
    expect(read(root, "package.json")).toBe(original);
  });

  it("stops on interpolated dynamic Layer imports that cannot be resolved safely", async () => {
    const root = createUiFixture({
      legacy: true,
      main: "export const loadUi = (part) => import(`@lilia/ui/${part}`);\n",
    });
    const original = read(root, "package.json");

    const report = await runUiMigration(root, { preset: "nana", commands: [] });

    expect(report.status).toBe("blocked");
    expect(report.blockers.some((item) => item.id === "parse-error")).toBe(true);
    expect(read(root, "package.json")).toBe(original);
  });

  it("reports unknown Layer subpaths as contract incompatibilities", async () => {
    const root = createUiFixture({ legacy: true, main: 'import value from "@lilia/ui/private";\n' });
    const inspection = await inspectUiMigration(root);

    expect(inspection.contractIncompatibilities).toHaveLength(1);
    expect(inspection.blockers).toHaveLength(1);
  });

  it("migrates shared diagnostics and runtime through the Nana facade", async () => {
    const root = createUiFixture({
      legacy: true,
      main: [
        'import { installAgentDebugHarness } from "@lilia/ui/diagnostics";',
        'import { installNativeAppearance } from "@lilia/ui/runtime";',
        "export { installAgentDebugHarness, installNativeAppearance };",
        "",
      ].join("\n"),
    });

    const report = await runUiMigration(root, { preset: "nana", commands: [] });

    expect(report.status).toBe("changed");
    expect(report.migration.contractIncompatibilities).toHaveLength(0);
    expect(read(root, "src/main.ts")).toContain('from "./ui"');
    expect(read(root, "src/ui/index.ts")).toContain('@lilia/nana-ui/diagnostics');
    expect(read(root, "src/ui/index.ts")).toContain('@lilia/nana-ui/runtime');
  });
});

function expectSfcToCompile(source) {
  const parsed = parse(source, { filename: "LegacyShell.vue" });
  expect(parsed.errors).toHaveLength(0);
  expect(() => compileScript(parsed.descriptor, { id: "legacy-shell" })).not.toThrow();
  const template = compileTemplate({
    id: "legacy-shell",
    filename: "LegacyShell.vue",
    source: parsed.descriptor.template.content,
    scoped: parsed.descriptor.styles.some((style) => style.scoped),
  });
  expect(template.errors).toHaveLength(0);
}

function knownLegacyAppShellSource() {
  return [
    '<script setup lang="ts">',
    'import { RouterView } from "vue-router";',
    'import SettingsSidebar from "./SettingsSidebar.vue";',
    'import { useRouteReturnTarget } from "@lilia/ui/composables/useRouteReturnTarget";',
    'import { useShellSidebar } from "@lilia/ui/composables/useShellSidebar";',
    'import { liliaShellOptionsKey } from "@lilia/ui/shell";',
    "void SettingsSidebar; void useRouteReturnTarget; void useShellSidebar; void liliaShellOptionsKey;",
    "</script>",
    '<template><div class="shell__resizer" /><main class="shell__main"><RouterView /></main></template>',
    "",
  ].join("\n");
}
