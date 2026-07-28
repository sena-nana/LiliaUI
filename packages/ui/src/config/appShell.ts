import { reactive, type Component } from "vue";
import { APP_METADATA, syncAppMetadata } from "./appShellMetadata";
import { resolveLiliaIcon, type IconInput } from "./appShellIcons";

export { APP_METADATA } from "./appShellMetadata";
export { resolveLiliaIcon, type IconInput, type IconName } from "./appShellIcons";

export interface LiliaSidebarFooterLinkInput {
  icon: IconInput;
  key: string;
  label: string;
  title?: string;
  to: string;
}

export interface LiliaSidebarFooterStatusInput {
  icon: IconInput;
  key?: string;
  label: string;
  title: string;
  to: string;
  tone: "ok" | "warn" | "error";
}

export interface LiliaSidebarConfigInput {
  footerLinks?: LiliaSidebarFooterLinkInput[];
  footerStatuses?: LiliaSidebarFooterStatusInput[];
}

export type NativePlatform = "macos" | "windows" | "linux";
export type BackdropMode = "system" | "mica" | "acrylic" | "solid";
export type BackdropTarget = "sidebar" | "main";

export interface LiliaPlatformAppearanceDefaults {
  backdropMode: BackdropMode;
}

export interface LiliaAppearanceConfigInput {
  backdropOpacity?: number;
  backdropTarget?: BackdropTarget;
  titlebarFollowsSidebar?: boolean;
  platformDefaults?: Partial<Record<NativePlatform, LiliaPlatformAppearanceDefaults>>;
}

export interface LiliaUiConfig {
  appearance?: LiliaAppearanceConfigInput;
  appName: string;
  identifier?: string;
  productTitle: string;
  sidebar?: LiliaSidebarConfigInput;
  storageKeyPrefix: string;
  version: string;
}

export interface SidebarActionItem {
  active?: boolean;
  disabled?: boolean;
  icon: Component;
  key: string;
  label: string;
  onSelect?: () => void | Promise<void>;
}

export interface SidebarNavItemBadge {
  key: string;
  label: string;
  title?: string;
  tone?: "accent" | "ok" | "warn" | "error" | "muted";
}

export interface SidebarNavItem {
  active?: boolean;
  badges?: SidebarNavItemBadge[];
  disabled?: boolean;
  emphasis?: "default" | "muted";
  icon: Component;
  key: string;
  label: string;
  onSelect?: () => void | Promise<void>;
  to?: string;
  tools?: SidebarActionItem[];
}

export interface SidebarFooterLink {
  icon: Component;
  key: string;
  label: string;
  title?: string;
  to: string;
}

export interface SidebarFooterStatus {
  icon: Component;
  key: string;
  label: string;
  title: string;
  to: string;
  tone: "ok" | "warn" | "error";
}

export const SIDEBAR_FOOTER_LINKS = reactive<SidebarFooterLink[]>([]);
export const SIDEBAR_FOOTER_STATUSES = reactive<SidebarFooterStatus[]>([]);

let currentConfig: LiliaUiConfig = {
  appName: APP_METADATA.appName,
  productTitle: APP_METADATA.productTitle,
  version: APP_METADATA.version,
  storageKeyPrefix: APP_METADATA.storageKeyPrefix,
};

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

export function setLiliaUiConfig(config: LiliaUiConfig) {
  currentConfig = config;
  syncAppMetadata(config);

  const sidebar = config.sidebar ?? {};
  replaceArray(
    SIDEBAR_FOOTER_LINKS,
    (sidebar.footerLinks ?? []).map((link) => ({
      ...link,
      icon: resolveLiliaIcon(link.icon),
    })),
  );
  replaceArray(
    SIDEBAR_FOOTER_STATUSES,
    (sidebar.footerStatuses ?? []).map((status, index) => ({
      ...status,
      key: status.key?.trim() || `status-${index + 1}`,
      icon: resolveLiliaIcon(status.icon),
    })),
  );
}

export function getLiliaUiConfig(): LiliaUiConfig {
  return currentConfig;
}
