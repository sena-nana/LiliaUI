import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "packages/ui/package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const require = createRequire(import.meta.url);

describe("@lilia/ui package exports", () => {
  it("uses an explicit allowlist and every target exists", () => {
    for (const [subpath, target] of Object.entries(manifest.exports)) {
      expect(subpath).not.toContain("*");
      expect(target).not.toContain("*");
      expect(existsSync(resolve(dirname(manifestPath), target))).toBe(true);
    }
  });

  it("rejects undeclared internal files", () => {
    for (const specifier of [
      "@lilia/ui/components/UiButton",
      "@lilia/ui/composables/useDismissableOverlay",
      "@lilia/ui/layouts/SecondaryPanel",
      "@lilia/ui/pages/SettingsPage",
    ]) {
      expect(() => require.resolve(specifier)).toThrow(/not defined by "exports"|Package subpath/);
    }
  });

  it("marks only CSS as side effects", () => {
    expect(manifest.sideEffects).toEqual(["**/*.css"]);
  });
});
