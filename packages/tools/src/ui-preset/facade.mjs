import { join } from "node:path";
import { readText } from "./files.mjs";
import { findModuleSpecifiers, rewriteModuleSpecifiers } from "./imports.mjs";
import {
  MANAGED_PRESET_END,
  MANAGED_PRESET_START,
  UI_FACADE_SUBPATHS,
  UI_LAYER_PACKAGES,
  UI_LAYER_SUBPATHS,
  UI_PRESETS,
  isSupportedLayerSubpath,
  layerPackage,
} from "./definitions.mjs";

export async function createFacadeOperation(projectRoot, path, preset, options = {}) {
  const before = await readText(join(projectRoot, path));
  if (before === null) {
    return operation(path, null, renderFacadeFile(path, preset, options), "create-facade");
  }
  try {
    const unsupported = unsupportedLayerSpecifiers(before, path, preset, options);
    if (unsupported.length) return incompatibility(path, unsupported);
    let after = rewriteModuleSpecifiers(before, path, (specifier) =>
      replaceLayerPackage(specifier, layerPackage(preset))).content;
    if (path.endsWith("preset.ts")) {
      const updated = updateManagedPreset(after, preset);
      if (updated.error) return { error: { ...updated.error, files: [path] } };
      after = updated.content;
    }
    return operation(path, before, after, "facade");
  } catch (error) {
    return { error: { id: "parse-error", severity: "error", detail: error.message, files: [path] } };
  }
}

function renderFacadeFile(path, preset, options) {
  const packageName = layerPackage(preset);
  if (path.endsWith("styles.css")) return `@import "${packageName}/styles.css";\n`;
  if (path.endsWith("contract.ts")) return 'export * from "@lilia/ui-contract";\n';
  if (path.endsWith("preset.ts")) return `${managedPresetBlock(preset)}\n`;
  const subpaths = options.facadeSubpaths ?? UI_FACADE_SUBPATHS[preset];
  return subpaths.map((subpath) => `export * from "${packageName}${subpath}";`).join("\n") + "\n";
}

function updateManagedPreset(source, preset) {
  const start = source.indexOf(MANAGED_PRESET_START);
  const end = source.indexOf(MANAGED_PRESET_END);
  if (start >= 0 && end > start) {
    return { content: `${source.slice(0, start)}${managedPresetBlock(preset)}${source.slice(end + MANAGED_PRESET_END.length)}` };
  }
  if (/\bappUIPresetId\b|\bappUIDefaultDensity\b/.test(source)) {
    return { error: {
      id: "unmanaged-preset",
      severity: "error",
      detail: "Preset metadata is customized without @lilia/tools markers; refusing to overwrite it.",
    } };
  }
  return { content: `${managedPresetBlock(preset)}\n\n${source}` };
}

function managedPresetBlock(preset) {
  const adapter = preset === "nana" ? "nanaPresetAdapter" : "liliaPresetAdapter";
  return [
    MANAGED_PRESET_START,
    `export { ${adapter} as appUIPreset } from "${layerPackage(preset)}/preset";`,
    "",
    `export const appUIPresetId = "${preset}" as const;`,
    `export const appUIDefaultDensity = "${UI_PRESETS[preset].defaultDensity}" as const;`,
    MANAGED_PRESET_END,
  ].join("\n");
}

function unsupportedLayerSpecifiers(source, path, preset, options) {
  const allowed = new Set(options.supportedSubpaths?.[preset] ?? UI_LAYER_SUBPATHS[preset]);
  return findModuleSpecifiers(source, path).flatMap(({ value }) => {
    const packageName = Object.values(UI_LAYER_PACKAGES).find((name) =>
      value === name || value.startsWith(`${name}/`));
    return packageName && !isSupportedLayerSubpath(value.slice(packageName.length), allowed) ? [value] : [];
  });
}

function replaceLayerPackage(specifier, targetPackage) {
  const packageName = Object.values(UI_LAYER_PACKAGES).find((name) =>
    specifier === name || specifier.startsWith(`${name}/`));
  return packageName ? `${targetPackage}${specifier.slice(packageName.length)}` : specifier;
}

function incompatibility(path, specifiers) {
  return { error: {
    id: "contract-incompatibility",
    severity: "error",
    detail: `Target Layer does not export: ${[...new Set(specifiers)].join(", ")}.`,
    files: [path],
  } };
}

function operation(path, before, after, reason) {
  return { path, before, after, reason };
}
