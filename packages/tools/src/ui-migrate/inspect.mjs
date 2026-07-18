import { join } from "node:path";
import { inspectUiProject } from "../ui-preset/inspect.mjs";
import { readText } from "../ui-preset/files.mjs";
import { UI_LAYER_SUBPATHS, isSupportedLayerSubpath } from "../ui-preset/definitions.mjs";

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
  const sources = await readSources(projectRoot, [...new Set(directImports.map((item) => item.path))]);
  const contractIncompatibilities = directImports.flatMap((item) => {
    const packageName = item.specifier.startsWith("@lilia/nana-ui") ? "@lilia/nana-ui" : "@lilia/ui";
    const subpath = item.specifier.slice(packageName.length);
    return isSupportedLayerSubpath(subpath, targetSubpaths) ? [] : [{
      severity: "error",
      path: item.path,
      detail: `Unknown Layer subpath cannot be migrated safely: ${item.specifier}`,
    }];
  });
  const legacyNamedShellFiles = sources.filter((item) => /\b(?:LiliaDesktopShell|LegacyAppShell|NanaDesktopShell)\b/.test(item.source));
  const legacyNanaShellFiles = sources.filter((item) => (
    /\bNanaAppShell\b/.test(item.source)
    && /(?:\bnavigation\b|settingsItem|settings-item|sidebarMode|sidebar-mode|contextVisible|context-visible|contextTitle|context-title)/.test(item.source)
  ));
  const legacyShellFiles = [...new Map(
    [...legacyNamedShellFiles, ...legacyNanaShellFiles].map((item) => [item.path, item]),
  ).values()];
  const shellFiles = sources.filter((item) => (
    /\b(?:createApp|Sidebar)\b/.test(item.source)
    && !legacyShellFiles.some((legacy) => legacy.path === item.path)
  ));
  const featureFiles = project.files.filter((path) => path.startsWith("src/features/"));

  return {
    schemaVersion: 1,
    project,
    directImports,
    safeChanges: directImports.map((item) => ({
      path: item.path,
      detail: `Route ${item.specifier} through the local UI facade.`,
    })),
    contractIncompatibilities,
    manualUiReview: featureFiles.map((path) => ({
      path,
      detail: "Review density, progressive disclosure, and non-color status cues for the selected preset.",
    })),
    informationArchitectureReview: [
      ...legacyShellFiles.map((item) => ({
        path: item.path,
        detail: "Router-owning Shell API was removed: compose the Layer AppShell, application Router, navigation, and layout explicitly.",
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
