/// <reference path="./shims-vue.d.ts" />

export { default as LiliaAppShell } from "./layouts/AppShell.vue";
export { default as LiliaSidebarFrame } from "./layouts/LiliaSidebarFrame.vue";
export { default as LiliaSidebarNavRow } from "./components/sidebar/SidebarNavRow.vue";
export { default as LiliaSidebarFooter } from "./components/sidebar/SidebarFooter.vue";
export {
  APP_METADATA,
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUSES,
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
  type SidebarNavItem,
} from "./config/appShell";
export {
  liliaShellOptionsKey,
  type LiliaShellOptions,
} from "./shellOptions";
