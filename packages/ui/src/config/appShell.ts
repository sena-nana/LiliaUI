import { reactive, type Component } from "vue";
import Bot from "@lucide/vue/dist/esm/icons/bot.mjs";
import Brain from "@lucide/vue/dist/esm/icons/brain.mjs";
import Download from "@lucide/vue/dist/esm/icons/download.mjs";
import Ellipsis from "@lucide/vue/dist/esm/icons/ellipsis.mjs";
import FilePlus from "@lucide/vue/dist/esm/icons/file-plus.mjs";
import Folder from "@lucide/vue/dist/esm/icons/folder.mjs";
import FolderCog from "@lucide/vue/dist/esm/icons/folder-cog.mjs";
import Gauge from "@lucide/vue/dist/esm/icons/gauge.mjs";
import House from "@lucide/vue/dist/esm/icons/house.mjs";
import Info from "@lucide/vue/dist/esm/icons/info.mjs";
import MonitorSmartphone from "@lucide/vue/dist/esm/icons/monitor-smartphone.mjs";
import MessageSquare from "@lucide/vue/dist/esm/icons/message-square.mjs";
import Network from "@lucide/vue/dist/esm/icons/network.mjs";
import Palette from "@lucide/vue/dist/esm/icons/palette.mjs";
import PanelTop from "@lucide/vue/dist/esm/icons/panel-top.mjs";
import Plus from "@lucide/vue/dist/esm/icons/plus.mjs";
import Puzzle from "@lucide/vue/dist/esm/icons/puzzle.mjs";
import Search from "@lucide/vue/dist/esm/icons/search.mjs";
import Server from "@lucide/vue/dist/esm/icons/server.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import Sparkles from "@lucide/vue/dist/esm/icons/sparkles.mjs";
import Workflow from "@lucide/vue/dist/esm/icons/workflow.mjs";

type IconName =
  | "bot"
  | "brain"
  | "download"
  | "file-plus"
  | "folder"
  | "folder-cog"
  | "gauge"
  | "home"
  | "info"
  | "message-square"
  | "monitor-smartphone"
  | "more"
  | "network"
  | "panel-top"
  | "palette"
  | "plus"
  | "puzzle"
  | "search"
  | "server"
  | "settings"
  | "sparkles"
  | "workflow";

export type IconInput = IconName | Component;

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

export const APP_METADATA = reactive({
  appName: "lilia-app",
  productTitle: "Lilia App",
  version: "0.1.0",
  storageKeyPrefix: "lilia-app",
});

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

const lucideIcons = {
  bot: Bot,
  brain: Brain,
  download: Download,
  "file-plus": FilePlus,
  folder: Folder,
  "folder-cog": FolderCog,
  gauge: Gauge,
  home: House,
  info: Info,
  "message-square": MessageSquare,
  "monitor-smartphone": MonitorSmartphone,
  more: Ellipsis,
  network: Network,
  "panel-top": PanelTop,
  palette: Palette,
  plus: Plus,
  puzzle: Puzzle,
  search: Search,
  server: Server,
  settings: Settings,
  sparkles: Sparkles,
  workflow: Workflow,
} satisfies Record<IconName, Component>;

export const SIDEBAR_FOOTER_LINKS = reactive<SidebarFooterLink[]>([]);
export const SIDEBAR_FOOTER_STATUSES = reactive<SidebarFooterStatus[]>([]);

let currentConfig: LiliaUiConfig = {
  appName: APP_METADATA.appName,
  productTitle: APP_METADATA.productTitle,
  version: APP_METADATA.version,
  storageKeyPrefix: APP_METADATA.storageKeyPrefix,
};

export function resolveLiliaIcon(icon: IconInput): Component {
  return typeof icon === "string" ? resolveLazyLucideIcon(icon) : icon;
}

function resolveLazyLucideIcon(icon: IconName): Component {
  return lucideIcons[icon];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

export function setLiliaUiConfig(config: LiliaUiConfig) {
  currentConfig = config;
  APP_METADATA.appName = config.appName;
  APP_METADATA.productTitle = config.productTitle;
  APP_METADATA.version = config.version;
  APP_METADATA.storageKeyPrefix = config.storageKeyPrefix;

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
