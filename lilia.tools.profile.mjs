import { defineToolsProfile } from "@lilia/tools";

export default defineToolsProfile({
  expectedDependencies: [],
  importantFiles: [
    ["AGENTS.md", "public package ownership and validation rules"],
    ["DESIGN.md", "shared UI design and performance standard"],
    ["packages/ui/src/index.ts", "stable common UI entrypoint"],
    ["packages/ui/package.json", "declared public subpath exports"],
    ["packages/config/src/index.mjs", "application metadata validation and synchronization"],
    ["packages/tools/src/index.mjs", "profile-driven project checks"],
    ["tests/perf/componentScenarios.ts", "public component performance scenarios"],
  ],
  boundaries: {
    includes: [
      "shared UI components, layouts, shell primitives, settings composition, and opt-in runtime installers",
      "shared config, tooling, build wrappers, and Tauri runtime support",
    ],
    excludes: [
      "application routes, business navigation, business commands, and product workflows",
      "implicit Vue application, Router, diagnostics, or optional runtime initialization",
    ],
  },
  entrypoints: [
    { id: "typecheck", command: "pnpm typecheck", purpose: "type-check every public package" },
    { id: "test", command: "pnpm test", purpose: "run functional package and component tests" },
    { id: "verify", command: "pnpm verify", purpose: "run browser and component performance gates" },
  ],
});
