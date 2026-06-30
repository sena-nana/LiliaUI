import { defineAsyncComponent } from "vue";

export { default as LiliaAppRoot } from "./AppRoot.vue";
export { default as LiliaDesktopShell } from "./layouts/AppShell.vue";
export { default as ConfirmDialog } from "./components/ConfirmDialog.vue";
export { default as ContextMenuHost } from "./components/ContextMenuHost.vue";
export { default as Dropdown } from "./components/Dropdown.vue";
export { default as TitleBar } from "./components/TitleBar.vue";
export { default as ViewTabs } from "./components/ViewTabs.vue";
export const LiliaSettingsPage = defineAsyncComponent(() => import("./pages/SettingsPage.vue"));

export {
  createLiliaApp,
  createLiliaRouter,
  type CreateLiliaAppOptions,
} from "./createLiliaApp";
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
  SIDEBAR_CONFIG,
  getLiliaAppConfig,
  normalizeSettingsTab,
  setLiliaAppConfig,
  type LiliaAppConfig,
  type LiliaShellCopy,
  type LiliaSidebarConfigInput,
} from "./config/appShell";
export * from "./composables/useContextMenu";
export * from "./composables/useCornerStyle";
export * from "./composables/useGlobalScrollbarVisibility";
export * from "./composables/useAnchoredMenuMotion";
export * from "./composables/menuMotion";
export * from "./composables/usePersistentState";
export * from "./composables/useResizablePane";
export * from "./composables/useRouteReturnTarget";
export * from "./composables/useShellSidebar";
export * from "./composables/useTheme";
export { vContextMenu } from "./directives/contextMenu";
