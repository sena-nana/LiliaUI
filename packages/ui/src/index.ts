/// <reference path="./shims-vue.d.ts" />

import { defineAsyncComponent } from "vue";

export { default as LiliaAppRoot } from "./AppRoot.vue";
export { default as LiliaDesktopShell } from "./layouts/AppShell.vue";
export { default as ActionMenuItem } from "./components/ActionMenuItem.vue";
export { default as AnchoredActionMenu } from "./components/AnchoredActionMenu.vue";
export { default as ConfirmDialog } from "./components/ConfirmDialog.vue";
export { default as ContributionHeatmap } from "./components/ContributionHeatmap.vue";
export { default as ContextMenuHost } from "./components/ContextMenuHost.vue";
export { default as Dropdown } from "./components/Dropdown.vue";
export { default as PopupTitleBarFrame } from "./components/PopupTitleBarFrame.vue";
export { default as SearchDropdown } from "./components/SearchDropdown.vue";
export { default as SettingsCollapsibleCard, type SettingsCollapsibleCardEmits, type SettingsCollapsibleCardProps } from "./components/SettingsCollapsibleCard.vue";
export { default as SettingsRow, type SettingsRowProps } from "./components/SettingsRow.vue";
export { default as SidebarCollapse } from "./components/sidebar/SidebarCollapse.vue";
export { default as TitleBar } from "./components/TitleBar.vue";
export { default as UiButton } from "./components/UiButton.vue";
export { default as UiCard } from "./components/UiCard.vue";
export { default as UiEmptyState } from "./components/UiEmptyState.vue";
export { default as UiIconButton } from "./components/UiIconButton.vue";
export { default as UiInput } from "./components/UiInput.vue";
export { default as UiRangeField } from "./components/UiRangeField.vue";
export { default as UiSegmentedControl } from "./components/UiSegmentedControl.vue";
export { default as UiSpinner } from "./components/UiSpinner.vue";
export { default as UiSwitch } from "./components/UiSwitch.vue";
export { default as UiTextarea } from "./components/UiTextarea.vue";
export { default as ViewTabs } from "./components/ViewTabs.vue";
export { default as PopupShell } from "./layouts/PopupShell.vue";
export type { UiButtonSize, UiButtonType, UiButtonVariant } from "./components/UiButton.vue";
export type { UiCardVariant } from "./components/UiCard.vue";
export type { UiSegmentedOption } from "./components/UiSegmentedControl.vue";
export type { UiSwitchControlPosition } from "./components/UiSwitch.vue";
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
  recordAgentDebugLog,
  uninstallAgentDebugHarness,
  type AgentDebugAction,
  type AgentDebugElementSnapshot,
  type AgentDebugLogEntry,
  type AgentDebugSnapshot,
  type InstallAgentDebugHarnessOptions,
  type LiliaAgentDebugApi,
} from "./agentDebug/index";
export {
  liliaShellOptionsKey,
  resolveShellBoolean,
  type LiliaShellOptions,
  type LiliaShellSetupOverlaySource,
} from "./shellOptions";
export {
  APP_METADATA,
  APP_SHELL_COPY,
  APP_TITLE,
  DEFAULT_SETTINGS_TAB,
  SETTINGS_CONFIG,
  SETTINGS_SECTIONS,
  SETTINGS_SECTION_PROPS,
  SETTINGS_TABS,
  SIDEBAR_CONFIG,
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUS,
  SIDEBAR_GLOBAL_ACTIONS,
  SIDEBAR_GROUPS,
  SIDEBAR_NAV,
  getLiliaAppConfig,
  normalizeSettingsTab,
  setLiliaAppConfig,
  type LiliaAppConfig,
  type LiliaRuntimeConfigInput,
  type LiliaSettingsConfigInput,
  type LiliaSettingsSectionInput,
  type LiliaSettingsSectionLoader,
  type LiliaSettingsTabInput,
  type LiliaShellCopy,
  type LiliaSidebarConfigInput,
  type SidebarActionItem,
  type SidebarFooterLink,
  type SidebarFooterStatus,
  type SidebarGroup,
  type SidebarNavItem,
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
export * from "./composables/useNativeWindowChrome";
export * from "./composables/menuMotion";
export * from "./composables/usePersistentState";
export * from "./composables/useResizablePane";
export * from "./composables/useRouteReturnTarget";
export * from "./composables/useShellSidebar";
export * from "./composables/useTheme";
export * from "./composables/useComponentEpoch";
export * from "./composables/useFocusOnActivation";
export * from "./utils/eventListeners";
export * from "./utils/contributionHeatmap";
export * from "./utils/lazyLoadState";
export * from "./utils/perf";
export * from "./utils/singleFlight";
export * from "./utils/textSegments";
export { vContextMenu } from "./directives/contextMenu";
