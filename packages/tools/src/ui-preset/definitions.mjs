export const UI_LAYER_PACKAGES = Object.freeze({
  lilia: "@lilia/ui",
  nana: "@lilia/nana-ui",
});

export const UI_SHARED_PACKAGES = Object.freeze([
  "@lilia/ui-contract",
  "@lilia/ui-foundation",
]);

export const UI_PRESETS = Object.freeze({
  lilia: Object.freeze({ id: "lilia", defaultDensity: "compact" }),
  nana: Object.freeze({ id: "nana", defaultDensity: "comfortable" }),
});

export const UI_LAYER_SUBPATHS = Object.freeze({
  lilia: Object.freeze([
    "", "/commands", "/diagnostics", "/preset", "/runtime", "/settings", "/shell",
    "/styles.css", "/theme/base.css",
  ]),
  nana: Object.freeze([
    "", "/consumer", "/expressive", "/feedback", "/lazy", "/patterns",
    "/commands", "/preset", "/provider", "/settings", "/shell", "/state",
    "/styles.css", "/theme/base.css",
  ]),
});

export const DEFAULT_UI_FILES = Object.freeze([
  "src/ui/index.ts",
  "src/ui/preset.ts",
  "src/ui/contract.ts",
  "src/ui/styles.css",
]);

export const MANAGED_PRESET_START = "// @lilia/ui-preset:start";
export const MANAGED_PRESET_END = "// @lilia/ui-preset:end";

export function assertPreset(value) {
  if (!(value in UI_PRESETS)) {
    throw new Error(`Unknown UI preset: ${value ?? "(missing)"}. Expected lilia or nana.`);
  }
  return value;
}

export function layerPackage(preset) {
  return UI_LAYER_PACKAGES[assertPreset(preset)];
}

export function isLayerSpecifier(specifier) {
  return Object.values(UI_LAYER_PACKAGES).some((name) =>
    specifier === name || specifier.startsWith(`${name}/`));
}

export function otherPreset(preset) {
  return assertPreset(preset) === "lilia" ? "nana" : "lilia";
}
