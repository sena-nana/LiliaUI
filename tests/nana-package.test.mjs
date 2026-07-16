import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";
import { describe, expect, it } from "vitest";

describe("@lilia/nana-ui package", () => {
  it("exposes stable responsibility subpaths without a Professional Layer dependency", async () => {
    const manifest = JSON.parse(readFileSync(resolve("packages/nana-ui/package.json"), "utf8"));
    expect(manifest.exports).toMatchObject({
      ".": expect.any(String),
      "./consumer": expect.any(String),
      "./lazy": expect.any(String),
      "./patterns": expect.any(String),
      "./preset": expect.any(String),
      "./shell": expect.any(String),
      "./state": expect.any(String),
      "./styles.css": expect.any(String),
    });
    expect(manifest.dependencies?.["@lilia/ui"]).toBeUndefined();
    expect(manifest.peerDependencies?.["@lilia/ui"]).toBeUndefined();
    await expect(import("@lilia/nana-ui")).resolves.toHaveProperty("NanaButton");
    await expect(import("@lilia/nana-ui/state")).resolves.toHaveProperty("createUndoManager");
    await expect(import("@lilia/nana-ui/preset")).resolves.toHaveProperty("nanaPresetAdapter");
  });

  it("tree-shakes shell, patterns, and Consumer components from a base-only build", async () => {
    const result = await build({
      configFile: false,
      logLevel: "silent",
      build: { write: false, rollupOptions: { input: "virtual:nana-base" } },
      plugins: [vue(), virtualEntry("virtual:nana-base", `import { Button } from "@lilia/nana-ui"; globalThis.__nanaBase = Button;`)],
    });
    const modules = outputModuleIds(result);
    expect(modules).toContainEqual(expect.stringContaining("NanaButton"));
    expect(modules.some((id) => id.includes("/nana-ui/src/shell/"))).toBe(false);
    expect(modules.some((id) => id.includes("/nana-ui/src/patterns/"))).toBe(false);
    expect(modules.some((id) => id.includes("/nana-ui/src/consumer/"))).toBe(false);
  });

  it("emits separate async chunks for lazy patterns and expressive feedback", async () => {
    const result = await build({
      configFile: false,
      logLevel: "silent",
      build: { write: false, rollupOptions: { input: "virtual:nana-lazy" } },
      plugins: [vue(), virtualEntry("virtual:nana-lazy", `import * as lazy from "@lilia/nana-ui/lazy"; globalThis.__nanaLazy = lazy;`)],
    });
    const chunks = outputChunks(result);
    const dynamicModules = chunks.filter((chunk) => chunk.isDynamicEntry)
      .flatMap((chunk) => Object.keys(chunk.modules));
    expect(dynamicModules).toContainEqual(expect.stringContaining("NanaEditorLayout"));
    expect(dynamicModules).toContainEqual(expect.stringContaining("RecoveryError"));
    expect(chunks.filter((chunk) => chunk.isDynamicEntry).length).toBeGreaterThanOrEqual(7);
  });
});

function virtualEntry(id, source) {
  return {
    name: id,
    resolveId(candidate) { return candidate === id ? `\0${id}` : undefined; },
    load(candidate) { return candidate === `\0${id}` ? source : undefined; },
  };
}

function outputChunks(result) {
  const outputs = Array.isArray(result) ? result.flatMap((entry) => entry.output) : result.output;
  return outputs.filter((entry) => entry.type === "chunk");
}

function outputModuleIds(result) {
  return outputChunks(result).flatMap((chunk) => Object.keys(chunk.modules));
}
