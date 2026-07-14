import { defineAsyncComponent, reactive, type Component } from "vue";
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
import Network from "@lucide/vue/dist/esm/icons/network.mjs";
import Palette from "@lucide/vue/dist/esm/icons/palette.mjs";
import PanelTop from "@lucide/vue/dist/esm/icons/panel-top.mjs";
import Puzzle from "@lucide/vue/dist/esm/icons/puzzle.mjs";
import Search from "@lucide/vue/dist/esm/icons/search.mjs";
import Server from "@lucide/vue/dist/esm/icons/server.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import Sparkles from "@lucide/vue/dist/esm/icons/sparkles.mjs";
import Workflow from "@lucide/vue/dist/esm/icons/workflow.mjs";
import type { RouteLocationRaw } from "vue-router";

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
  | "monitor-smartphone"
  | "more"
  | "network"
  | "panel-top"
  | "palette"
  | "puzzle"
  | "search"
  | "server"
  | "settings"
  | "sparkles"
  | "workflow";

type IconInput = IconName | Component;
export type LiliaSettingsSectionLoader = () => Promise<{ default: Component }>;
export type LiliaSettingsSectionInput = Component | LiliaSettingsSectionLoader;

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
  onSelect?: () => void | Promise<void>;
}

export interface LiliaSidebarNavInput {
  active?: boolean;
  disabled?: boolean;
  icon: IconInput;
  key: string;
  label: string;
  onSelect?: () => void | Promise<void>;
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

export interface LiliaSettingsTabInput {
  icon: IconInput;
  key: string;
  label: string;
  props?: Record<string, unknown>;
  to?: RouteLocationRaw;
}

export interface LiliaSettingsConfigInput {
  aliases?: Record<string, string>;
  defaultTab?: string;
  fullPageTabs?: string[];
  hideHeader?: boolean;
  path?: string;
  sections?: Record<string, LiliaSettingsSectionInput>;
  tabs?: LiliaSettingsTabInput[];
}

export interface LiliaRuntimeConfigInput {
  agentDebug?: boolean | { maxLogEntries?: number };
  contextMenu?: boolean;
  globalScrollbar?: boolean;
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
  platformDefaults?: Partial<Record<NativePlatform, LiliaPlatformAppearanceDefaults>>;
}

export interface LiliaAppConfig {
  appearance?: LiliaAppearanceConfigInput;
  appName: string;
  identifier?: string;
  productTitle: string;
  runtime?: LiliaRuntimeConfigInput;
  settings?: LiliaSettingsConfigInput;
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
  icon: Component;
  key: string;
  label: string;
  onSelect?: () => void | Promise<void>;
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
  "monitor-smartphone": MonitorSmartphone,
  more: Ellipsis,
  network: Network,
  "panel-top": PanelTop,
  palette: Palette,
  puzzle: Puzzle,
  search: Search,
  server: Server,
  settings: Settings,
  sparkles: Sparkles,
  workflow: Workflow,
} satisfies Record<IconName, Component>;

export const SIDEBAR_GLOBAL_ACTIONS = reactive<SidebarActionItem[]>([]);
export const SIDEBAR_NAV = reactive<SidebarNavItem[]>([]);
export const SIDEBAR_GROUPS = reactive<SidebarGroup[]>([]);
export const SIDEBAR_FOOTER_LINKS = reactive<SidebarFooterLink[]>([]);
export const SIDEBAR_FOOTER_STATUS = reactive<SidebarFooterStatus>({
  to: "/settings",
  label: "Ready",
  title: "应用状态正常。点击进入设置。",
  tone: "ok",
  icon: resolveLazyLucideIcon("sparkles"),
});

export type SettingsTabKey = string;

export interface SettingsTab {
  icon: Component;
  key: SettingsTabKey;
  label: string;
  props?: Record<string, unknown>;
  to: RouteLocationRaw;
}

export const SETTINGS_TABS = reactive<SettingsTab[]>(defaultSettingsTabs("/settings"));

export const DEFAULT_SETTINGS_TAB: SettingsTabKey = "appearance";

export const SETTINGS_SECTIONS: Record<SettingsTabKey, Component> = defaultSettingsSections();

export const SETTINGS_SECTION_PROPS = reactive<Record<string, Record<string, unknown>>>({});

export const SETTINGS_CONFIG = reactive({
  aliases: {} as Record<string, string>,
  defaultTab: DEFAULT_SETTINGS_TAB,
  fullPageTabs: new Set<string>(),
  hideHeader: false,
  path: "/settings",
});

let currentConfig: LiliaAppConfig = {
  appName: APP_METADATA.appName,
  productTitle: APP_METADATA.productTitle,
  version: APP_METADATA.version,
  storageKeyPrefix: APP_METADATA.storageKeyPrefix,
};

function resolveIcon(icon: IconInput): Component {
  return typeof icon === "string" ? resolveLazyLucideIcon(icon) : icon;
}

function resolveLazyLucideIcon(icon: IconName): Component {
  return lucideIcons[icon];
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

function replaceObject<T>(target: Record<string, T>, next: Record<string, T>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, next);
}

function replaceSet<T>(target: Set<T>, next: Iterable<T>) {
  target.clear();
  for (const value of next) target.add(value);
}

function isSectionLoader(section: LiliaSettingsSectionInput): section is LiliaSettingsSectionLoader {
  return typeof section === "function" && !("setup" in section) && !("render" in section);
}

function resolveSettingsSection(section: LiliaSettingsSectionInput): Component {
  return isSectionLoader(section) ? defineAsyncComponent(section) : section;
}

function defaultSettingsTabs(path: string): SettingsTab[] {
  return [
    {
      key: "appearance",
      label: "外观",
      icon: resolveLazyLucideIcon("palette"),
      to: { path, query: { tab: "appearance" } },
    },
    {
      key: "about",
      label: "关于",
      icon: resolveLazyLucideIcon("info"),
      to: { path, query: { tab: "about" } },
    },
  ];
}

function defaultSettingsSections(): Record<string, Component> {
  return {
    appearance: defineAsyncComponent(() => import("../pages/settings/AppearanceSection.vue")),
    about: defineAsyncComponent(() => import("../pages/settings/AboutSection.vue")),
  };
}

function resolveSettingsTab(tab: LiliaSettingsTabInput, path: string): SettingsTab {
  return {
    ...tab,
    icon: resolveIcon(tab.icon),
    to: tab.to ?? { path, query: { tab: tab.key } },
  };
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

  const settings = config.settings ?? {};
  SETTINGS_CONFIG.defaultTab = settings.defaultTab ?? "appearance";
  SETTINGS_CONFIG.hideHeader = settings.hideHeader ?? false;
  SETTINGS_CONFIG.path = settings.path ?? "/settings";
  replaceObject(SETTINGS_CONFIG.aliases, settings.aliases ?? {});
  replaceSet(SETTINGS_CONFIG.fullPageTabs, settings.fullPageTabs ?? []);
  replaceArray(
    SETTINGS_TABS,
    settings.tabs?.map((tab) => resolveSettingsTab(tab, SETTINGS_CONFIG.path)) ??
      defaultSettingsTabs(SETTINGS_CONFIG.path),
  );
  replaceObject(
    SETTINGS_SECTIONS,
    settings.sections
      ? Object.fromEntries(
        Object.entries(settings.sections).map(([key, section]) => [
          key,
          resolveSettingsSection(section),
        ]),
      )
      : defaultSettingsSections(),
  );
  replaceObject(
    SETTINGS_SECTION_PROPS,
    Object.fromEntries(SETTINGS_TABS.map((tab) => [tab.key, tab.props ?? {}])),
  );
}

export function getLiliaAppConfig(): LiliaAppConfig {
  return currentConfig;
}

export function normalizeSettingsTab(value: unknown): SettingsTabKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  const raw = typeof candidate === "string" ? candidate : "";
  const resolved = SETTINGS_CONFIG.aliases[raw] ?? raw;
  return SETTINGS_TABS.some((tab) => tab.key === resolved)
    ? resolved
    : SETTINGS_CONFIG.defaultTab;
}
