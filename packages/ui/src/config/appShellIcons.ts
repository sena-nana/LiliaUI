import type { Component } from "vue";
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

export type IconName =
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

export function resolveLiliaIcon(icon: IconInput): Component {
  return typeof icon === "string" ? lucideIcons[icon] : icon;
}
