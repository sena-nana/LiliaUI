/// <reference path="./shims-vue.d.ts" />

export { default as LiliaAppShell } from "./layouts/AppShell.vue";
/** @deprecated Compose LiliaAppShell with Workspace Regions instead. */
export { default as LiliaDesktopShell } from "./layouts/LegacyAppShell.vue";
export { default as LiliaSidebarFrame } from "./layouts/LiliaSidebarFrame.vue";
export { default as LiliaSidebarNavRow } from "./components/sidebar/SidebarNavRow.vue";
export { default as LiliaSidebarFooter } from "./components/sidebar/SidebarFooter.vue";
export {
  APP_METADATA,
  SIDEBAR_CONFIG,
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUSES,
  SIDEBAR_GLOBAL_ACTIONS,
  SIDEBAR_GROUPS,
  SIDEBAR_NAV,
  SIDEBAR_TOP_CONTENT,
  getLiliaUiConfig,
  resolveLiliaIcon,
  setLiliaUiConfig,
  type BackdropMode,
  type BackdropTarget,
  type IconInput,
  type LiliaAppearanceConfigInput,
  type LiliaPlatformAppearanceDefaults,
  type LiliaSidebarConfigInput,
  type LiliaSidebarFooterStatusInput,
  type LiliaUiConfig,
  type NativePlatform,
  type SidebarActionItem,
  type SidebarFooterLink,
  type SidebarFooterStatus,
  type SidebarGroup,
  type SidebarNavItem,
} from "./config/appShell";
export {
  liliaShellOptionsKey,
  resolveShellBoolean,
  type LiliaShellOptions,
  type LiliaShellSetupOverlaySource,
} from "./shellOptions";
