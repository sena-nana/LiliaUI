import {
  FilePlus2,
  Folder,
  Home,
  Info,
  MoreHorizontal,
  Palette,
  Puzzle,
  Search,
  Settings,
  Sparkles,
} from "@lucide/vue";
import { defineAsyncComponent, reactive, type Component } from "vue";
import type { RouteLocationRaw } from "vue-router";

type IconName =
  | "file-plus"
  | "folder"
  | "home"
  | "info"
  | "more"
  | "palette"
  | "puzzle"
  | "search"
  | "settings"
  | "sparkles";

type IconInput = IconName | Component;

export interface LiliaShellCopy {
  homeTitle: string;
  homeDescription: string;
  homeActionLabel?: string;
  workspaceSectionTitle: string;
  workspaceName: string;
  workspaceEmptyText: string;
  statusLabel: string;
  statusTitle: string;
  settingsDescription: string;
}

export interface LiliaSidebarActionInput {
  disabled?: boolean;
  icon: IconInput;
  key: string;
  label: string;
}

export interface LiliaSidebarNavInput {
  disabled?: boolean;
  icon: IconInput;
  key: string;
  label: string;
  to?: string;
  tools?: LiliaSidebarActionInput[];
}

export interface LiliaSidebarGroupInput {
  emptyText?: string;
  items?: LiliaSidebarNavInput[];
  key: string;
  title: string;
  tools?: LiliaSidebarActionInput[];
}

export interface LiliaSidebarFooterLinkInput {
  icon: IconInput;
  key: string;
  label: string;
  title?: string;
  to: string;
}

export interface LiliaSidebarFooterStatusInput {
  icon: IconInput;
  label: string;
  title: string;
  to: string;
  tone: "ok" | "warn" | "error";
}

export interface LiliaSidebarConfigInput {
  collapsedStorageKey?: string;
  defaultWidth?: number;
  footerLinks?: LiliaSidebarFooterLinkInput[];
  footerStatus?: LiliaSidebarFooterStatusInput;
  globalActions?: LiliaSidebarActionInput[];
  groups?: LiliaSidebarGroupInput[];
  maxWidth?: number;
  minWidth?: number;
  nav?: LiliaSidebarNavInput[];
  widthStorageKey?: string;
}

export interface LiliaAppConfig {
  appName: string;
  identifier?: string;
  productTitle: string;
  shell?: Partial<LiliaShellCopy>;
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

export const APP_SHELL_COPY = reactive<LiliaShellCopy>({
  homeTitle: "首页",
  homeDescription: "",
  workspaceSectionTitle: "工作区",
  workspaceName: "Workspace",
  workspaceEmptyText: "",
  statusLabel: "Ready",
  statusTitle: "应用状态正常。点击进入设置。",
  settingsDescription: "偏好设置会保存到本地。",
});

export const APP_TITLE = APP_METADATA.productTitle;

export const SIDEBAR_CONFIG = reactive({
  widthStorageKey: "lilia-app.sidebarWidth",
  collapsedStorageKey: "lilia-app.sidebarCollapsed",
  minWidth: 180,
  maxWidth: 480,
  defaultWidth: 220,
});

export interface SidebarActionItem {
  disabled?: boolean;
  icon: Component;
  key: string;
  label: string;
}

export interface SidebarNavItem {
  disabled?: boolean;
  icon: Component;
  key: string;
  label: string;
  to?: string;
  tools?: SidebarActionItem[];
}

export interface SidebarGroup {
  emptyText?: string;
  items?: SidebarNavItem[];
  key: string;
  title: string;
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
  label: string;
  title: string;
  to: string;
  tone: "ok" | "warn" | "error";
}

export const SIDEBAR_GLOBAL_ACTIONS = reactive<SidebarActionItem[]>([]);
export const SIDEBAR_NAV = reactive<SidebarNavItem[]>([]);
export const SIDEBAR_GROUPS = reactive<SidebarGroup[]>([]);
export const SIDEBAR_FOOTER_LINKS = reactive<SidebarFooterLink[]>([]);
export const SIDEBAR_FOOTER_STATUS = reactive<SidebarFooterStatus>({
  to: "/settings",
  label: "Ready",
  title: "应用状态正常。点击进入设置。",
  tone: "ok",
  icon: Sparkles as Component,
});

export type SettingsTabKey = "appearance" | "about";

export interface SettingsTab {
  icon: Component;
  key: SettingsTabKey;
  label: string;
  to: RouteLocationRaw;
}

export const SETTINGS_TABS = reactive<SettingsTab[]>([
  {
    key: "appearance",
    label: "外观",
    icon: Palette as Component,
    to: { path: "/settings", query: { tab: "appearance" } },
  },
  {
    key: "about",
    label: "关于",
    icon: Info as Component,
    to: { path: "/settings", query: { tab: "about" } },
  },
]);

export const DEFAULT_SETTINGS_TAB: SettingsTabKey = "appearance";

export const SETTINGS_SECTIONS: Record<SettingsTabKey, Component> = {
  appearance: defineAsyncComponent(() => import("../pages/settings/AppearanceSection.vue")),
  about: defineAsyncComponent(() => import("../pages/settings/AboutSection.vue")),
};

const iconMap: Record<IconName, Component> = {
  "file-plus": FilePlus2 as Component,
  folder: Folder as Component,
  home: Home as Component,
  info: Info as Component,
  more: MoreHorizontal as Component,
  palette: Palette as Component,
  puzzle: Puzzle as Component,
  search: Search as Component,
  settings: Settings as Component,
  sparkles: Sparkles as Component,
};

let currentConfig: LiliaAppConfig = {
  appName: APP_METADATA.appName,
  productTitle: APP_METADATA.productTitle,
  version: APP_METADATA.version,
  storageKeyPrefix: APP_METADATA.storageKeyPrefix,
};

function resolveIcon(icon: IconInput): Component {
  return typeof icon === "string" ? iconMap[icon] : icon;
}

function resolveAction(action: LiliaSidebarActionInput): SidebarActionItem {
  return {
    ...action,
    icon: resolveIcon(action.icon),
  };
}

function resolveNav(item: LiliaSidebarNavInput): SidebarNavItem {
  return {
    ...item,
    icon: resolveIcon(item.icon),
    tools: item.tools?.map(resolveAction),
  };
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

export function setLiliaAppConfig(config: LiliaAppConfig) {
  currentConfig = config;
  APP_METADATA.appName = config.appName;
  APP_METADATA.productTitle = config.productTitle;
  APP_METADATA.version = config.version;
  APP_METADATA.storageKeyPrefix = config.storageKeyPrefix;

  Object.assign(APP_SHELL_COPY, {
    homeTitle: "首页",
    homeDescription: "",
    homeActionLabel: undefined,
    workspaceSectionTitle: "工作区",
    workspaceName: "Workspace",
    workspaceEmptyText: "",
    statusLabel: "Ready",
    statusTitle: "应用状态正常。点击进入设置。",
    settingsDescription: "偏好设置会保存到本地。",
    ...config.shell,
  });

  const sidebar = config.sidebar ?? {};
  Object.assign(SIDEBAR_CONFIG, {
    widthStorageKey: sidebar.widthStorageKey ?? `${config.storageKeyPrefix}.sidebarWidth`,
    collapsedStorageKey: sidebar.collapsedStorageKey ?? `${config.storageKeyPrefix}.sidebarCollapsed`,
    minWidth: sidebar.minWidth ?? 180,
    maxWidth: sidebar.maxWidth ?? 480,
    defaultWidth: sidebar.defaultWidth ?? 220,
  });

  replaceArray(SIDEBAR_GLOBAL_ACTIONS, (sidebar.globalActions ?? []).map(resolveAction));
  replaceArray(SIDEBAR_NAV, (sidebar.nav ?? []).map(resolveNav));
  replaceArray(
    SIDEBAR_GROUPS,
    (sidebar.groups ?? []).map((group) => ({
      ...group,
      items: group.items?.map(resolveNav),
      tools: group.tools?.map(resolveAction),
    })),
  );
  replaceArray(
    SIDEBAR_FOOTER_LINKS,
    (sidebar.footerLinks ?? [
      { key: "settings", to: "/settings", label: "设置", icon: "settings" },
    ]).map((link) => ({
      ...link,
      icon: resolveIcon(link.icon),
    })),
  );
  Object.assign(SIDEBAR_FOOTER_STATUS, {
    ...(sidebar.footerStatus ?? {
      to: "/settings",
      label: APP_SHELL_COPY.statusLabel,
      title: APP_SHELL_COPY.statusTitle,
      tone: "ok",
      icon: "sparkles",
    }),
    icon: resolveIcon(sidebar.footerStatus?.icon ?? "sparkles"),
  });
}

export function getLiliaAppConfig(): LiliaAppConfig {
  return currentConfig;
}

export function normalizeSettingsTab(value: unknown): SettingsTabKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  return SETTINGS_TABS.some((tab) => tab.key === candidate)
    ? (candidate as SettingsTabKey)
    : DEFAULT_SETTINGS_TAB;
}
