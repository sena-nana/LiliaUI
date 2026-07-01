import { defineAsyncComponent } from "vue";

export { default as LiliaAppRoot } from "./AppRoot.vue";
export { default as LiliaDesktopShell } from "./layouts/AppShell.vue";
export { default as ActionMenuItem } from "./components/ActionMenuItem.vue";
export { default as AnchoredActionMenu } from "./components/AnchoredActionMenu.vue";
export { default as ConfirmDialog } from "./components/ConfirmDialog.vue";
export { default as ContextMenuHost } from "./components/ContextMenuHost.vue";
export { default as Dropdown } from "./components/Dropdown.vue";
export { default as PopupTitleBarFrame } from "./components/PopupTitleBarFrame.vue";
export { default as SearchDropdown } from "./components/SearchDropdown.vue";
export { default as SettingsCollapsibleCard } from "./components/SettingsCollapsibleCard.vue";
export { default as TitleBar } from "./components/TitleBar.vue";
export { default as PopupShell } from "./layouts/PopupShell.vue";
export const LiliaSettingsPage = defineAsyncComponent(() => import("./pages/SettingsPage.vue"));

export {
  createLiliaApp,
  createLiliaRouter,
  type CreateLiliaAppOptions,
} from "./createLiliaApp";
export {
  installLiliaAppRuntime,
  type InstallLiliaAppRuntimeOptions,
} from "./runtime";
export {
  createCommandRegistry,
  installCommandRegistry,
  liliaCommandsKey,
  type LiliaCommandHandler,
  type LiliaCommandMap,
  type LiliaCommandRegistry,
} from "./commands";
export {
  installAgentDebugHarness,
  isLiliaAgentDebugEnabled,
  uninstallAgentDebugHarness,
  type AgentDebugAction,
  type AgentDebugElementSnapshot,
  type AgentDebugLogEntry,
  type AgentDebugSnapshot,
  type InstallAgentDebugHarnessOptions,
  type LiliaAgentDebugApi,
} from "./agentDebug/index";
export {
  APP_METADATA,
  APP_SHELL_COPY,
  SETTINGS_CONFIG,
  SETTINGS_SECTIONS,
  SETTINGS_SECTION_PROPS,
  SETTINGS_TABS,
  SIDEBAR_CONFIG,
  getLiliaAppConfig,
  normalizeSettingsTab,
  setLiliaAppConfig,
  type LiliaAppConfig,
  type LiliaSettingsConfigInput,
  type LiliaSettingsSectionInput,
  type LiliaSettingsSectionLoader,
  type LiliaSettingsTabInput,
  type LiliaShellCopy,
  type LiliaSidebarConfigInput,
  type SettingsTab,
  type SettingsTabKey,
} from "./config/appShell";
export * from "./composables/useContextMenu";
export * from "./composables/useCornerStyle";
export * from "./composables/useGlobalScrollbarVisibility";
export * from "./composables/useAnchoredOverlay";
export * from "./composables/useAnchoredActionMenu";
export * from "./composables/useAnchoredMenuMotion";
export * from "./composables/useDismissableOverlay";
export * from "./composables/useTauriWindowControls";
export * from "./composables/menuMotion";
export * from "./composables/usePersistentState";
export * from "./composables/useResizablePane";
export * from "./composables/useRouteReturnTarget";
export * from "./composables/useShellSidebar";
export * from "./composables/useTheme";
export * from "./composables/useComponentEpoch";
export * from "./composables/useFocusOnActivation";
export * from "./utils/eventListeners";
export * from "./utils/lazyLoadState";
export * from "./utils/perf";
export * from "./utils/singleFlight";
export * from "./utils/textSegments";
export { vContextMenu } from "./directives/contextMenu";
