// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  inspectUiMigration,
  runUiMigration,
} from "@lilia/tools/ui-migrate";
import { createUiFixture, read, write } from "./uiFixture.mjs";

describe("UI migration tooling", () => {
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

  it("stops before writing when the target Layer lacks a known source subpath", async () => {
    const root = createUiFixture({
      legacy: true,
      main: 'import { configurePerfDiagnostics } from "@lilia/ui/diagnostics";\n',
    });
    const original = read(root, "package.json");

    const report = await runUiMigration(root, { preset: "nana", commands: [] });

    expect(report.status).toBe("blocked");
    expect(report.migration.contractIncompatibilities).toHaveLength(1);
    expect(read(root, "package.json")).toBe(original);
  });
});
