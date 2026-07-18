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
    "", "/calendar", "/commands", "/composables", "/diagnostics", "/layouts", "/overlay",
    "/preset", "/runtime", "/runtime/tauri", "/search", "/settings", "/shell",
    "/styles.css", "/styles/global-scrollbar.css", "/styles/page.css", "/styles/shell.css",
    "/styles/sidebar.css", "/styles/state-layer.css", "/styles/tokens.css", "/styles/workspace.css", "/theme/base.css",
    "/components/action-menu.css", "/components/popup-titlebar-frame.css", "/components/search-dropdown.css",
    "/components/ActionMenuItem", "/components/AnchoredActionMenu", "/components/CalendarHeatmap",
    "/components/ConfirmDialog", "/components/ContextMenuHost", "/components/Dropdown",
    "/components/OverlayHost", "/components/PopupTitleBarFrame", "/components/SearchDropdown",
    "/components/TitleBar", "/composables/menuMotion", "/composables/useAnchoredActionMenu",
    "/composables/useAnchoredOverlay", "/composables/useComponentEpoch", "/composables/useContextMenu",
    "/composables/useCornerStyle", "/composables/useFocusOnActivation", "/composables/useNativeAppearance",
    "/composables/useNativeWindowChrome", "/composables/usePersistentState", "/composables/useResizablePane",
    "/composables/useShellSidebar", "/composables/useTheme", "/directives/contextMenu",
    "/layouts/popup-shell.css", "/layouts/PopupShell",
    "/utils/calendarHeatmap", "/utils/eventListeners", "/utils/lazyLoadState", "/utils/singleFlight",
    "/utils/textSegments",
  ]),
  nana: Object.freeze([
    "", "/consumer", "/expressive", "/feedback", "/lazy", "/patterns",
    "/commands", "/preset", "/provider", "/settings", "/shell", "/state",
    "/styles.css", "/styles/state-layer.css", "/theme/base.css", "/theme/tokens.css",
  ]),
});

export const UI_FACADE_SUBPATHS = Object.freeze({
  lilia: Object.freeze([
    "", "/commands", "/diagnostics", "/layouts", "/runtime", "/settings", "/shell",
  ]),
  nana: Object.freeze(["", "/commands", "/settings", "/shell"]),
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

export function isSupportedLayerSubpath(subpath, supportedSubpaths) {
  return [...supportedSubpaths].some((candidate) => {
    if (!candidate.endsWith("*")) return candidate === subpath;
    const prefix = candidate.slice(0, -1);
    return subpath.startsWith(prefix) && subpath.length > prefix.length;
  });
}

export function otherPreset(preset) {
  return assertPreset(preset) === "lilia" ? "nana" : "lilia";
}
