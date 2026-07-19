import { join } from "node:path";
import { inspectUiProject } from "../ui-preset/inspect.mjs";
import { readText } from "../ui-preset/files.mjs";
import { UI_LAYER_SUBPATHS, isSupportedLayerSubpath } from "../ui-preset/definitions.mjs";
import {
  detectLegacyShellMigration,
  LEGACY_SHELL_COMPONENT_PATH,
} from "./shell.mjs";

const KNOWN_LAYER_SUBPATHS = new Set([
  "",
  "/commands",
  "/diagnostics",
  "/preset",
  "/preset/definition",
  "/provider",
  "/runtime",
  "/settings",
  "/shell",
  "/styles.css",
  "/theme/base.css",
]);

export async function inspectUiMigration(projectRoot = process.cwd(), options = {}) {
  const project = await inspectUiProject(projectRoot, options);
  const targetPreset = options.preset ?? project.current.preset;
  const targetSubpaths = new Set(options.supportedSubpaths?.[targetPreset]
    ?? UI_LAYER_SUBPATHS[targetPreset]
    ?? KNOWN_LAYER_SUBPATHS);
  const directImports = project.imports.filter((item) => item.specifier && !item.path.startsWith("src/ui/"));
  const sourcePaths = new Set([
    ...directImports.map((item) => item.path),
    ...project.files.filter((path) => (
      path.endsWith("/LegacyAppShell.vue")
      || path === LEGACY_SHELL_COMPONENT_PATH
    )),
  ]);
  const sources = await readSources(projectRoot, sourcePaths);
  const rawContractIncompatibilities = directImports.flatMap((item) => {
    const packageName = item.specifier.startsWith("@lilia/nana-ui") ? "@lilia/nana-ui" : "@lilia/ui";
    const subpath = item.specifier.slice(packageName.length);
    return isSupportedLayerSubpath(subpath, targetSubpaths) ? [] : [{
      severity: "error",
      path: item.path,
      detail: `Unknown Layer subpath cannot be migrated safely: ${item.specifier}`,
    }];
  });
  const importsByPath = Map.groupBy(project.imports.filter((item) => item.specifier), (item) => item.path);
  const legacyShellMigrations = sources.flatMap((item) => {
    const migration = detectLegacyShellMigration(item.path, item.source, importsByPath.get(item.path) ?? []);
    return migration ? [migration] : [];
  });
  const replacedShellPaths = new Set(legacyShellMigrations
    .filter((item) => item.automatic && item.strategy === "replace-file")
    .map((item) => item.path));
  const contractIncompatibilities = rawContractIncompatibilities
    .filter((item) => !replacedShellPaths.has(item.path));
  const legacyShellPaths = new Set(legacyShellMigrations.map((item) => item.path));
  const shellFiles = sources.filter((item) => (
    /\b(?:createApp|Sidebar)\b/.test(item.source)
    && !legacyShellPaths.has(item.path)
  ));
  const featureFiles = project.files.filter((path) => path.startsWith("src/features/"));

  return {
    schemaVersion: 1,
    project,
    directImports,
    safeChanges: directImports.filter((item) => !replacedShellPaths.has(item.path)).map((item) => ({
      path: item.path,
      detail: `Route ${item.specifier} through the local UI facade.`,
    })).concat(legacyShellMigrations.filter((item) => (
      item.automatic && (item.kind !== "managed-scaffold" || item.layer !== targetPreset)
    )).map((item) => ({
      path: item.path,
      detail: item.detail,
    }))),
    legacyShellMigrations,
    contractIncompatibilities,
    manualUiReview: featureFiles.map((path) => ({
      path,
      detail: "Review density, progressive disclosure, and non-color status cues for the selected preset.",
    })),
    informationArchitectureReview: [
      ...legacyShellMigrations.filter((item) => item.kind !== "managed-scaffold").map((item) => ({
        path: item.path,
        detail: item.automatic
          ? "Router-owning Shell API was removed; a consumer-owned migration scaffold can preserve the Router boundary, but application navigation and layout still require review."
          : item.detail,
      })),
      ...shellFiles.map((item) => ({
        path: item.path,
        detail: "Custom shell, sidebar, or mount behavior requires an information-architecture review.",
      })),
    ],
    recoveryFeedbackGaps: featureFiles.map((path) => ({
      path,
      detail: "Confirm critical feedback has recovery actions and is not toast-only.",
    })),
    bundleStyleConflicts: project.current.preset === "conflict" || project.current.facade === "conflict"
      ? [{ path: "package.json", detail: "Both complete UI Layers may enter the bundle." }]
      : [],
    blockers: [
      ...project.drift.filter((item) => item.id === "parse-error"),
      ...contractIncompatibilities,
      ...legacyShellMigrations.filter((item) => !item.automatic).map((item) => ({
        id: "legacy-shell-customization",
        severity: "error",
        detail: item.detail,
        files: [item.path],
      })),
    ],
  };
}

async function readSources(projectRoot, paths) {
  const sources = [];
  for (const path of paths) {
    sources.push({ path, source: await readText(join(projectRoot, path), "") });
  }
  return sources;
}
