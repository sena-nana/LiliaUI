import type {
  AccessibleLabelProps,
  AgentTargetProps,
  MaybePromise,
  UIOrientation,
  UIStatusTone,
} from "./common";

export interface TabOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TabsProps<T = string> extends AgentTargetProps, AccessibleLabelProps {
  modelValue: T;
  options: readonly TabOption<T>[];
  orientation?: UIOrientation;
}
export interface SelectionEmits<T = string | number> {
  "update:modelValue": [value: T];
  change: [value: T];
}

export interface SegmentedControlProps<T = string | number>
  extends AgentTargetProps, AccessibleLabelProps {
  modelValue: T;
  options: readonly TabOption<T>[];
  orientation?: UIOrientation;
}

export interface SidebarItem extends AgentTargetProps {
  id: string;
  label: string;
  icon?: unknown;
  active?: boolean;
  disabled?: boolean;
  href?: string;
  depth?: number;
  badges?: readonly SidebarBadge[];
  actions?: readonly SidebarAction[];
}

export interface SidebarBadge extends AgentTargetProps {
  id: string;
  label: string;
  tone?: UIStatusTone;
}

export interface SidebarAction extends AgentTargetProps {
  id: string;
  label: string;
  icon?: unknown;
  active?: boolean;
  disabled?: boolean;
  run: () => MaybePromise<void>;
}

export interface SidebarSection extends AgentTargetProps {
  id: string;
  label: string;
  items: readonly SidebarItem[];
  emptyText?: string;
  actions?: readonly SidebarAction[];
}

export type SidebarMode = "expanded" | "icon";

export interface SidebarProps extends AgentTargetProps {
  items?: readonly SidebarItem[];
  sections?: readonly SidebarSection[];
  mode?: SidebarMode;
  collapsible?: boolean;
  settingsItem?: SidebarItem;
}

export interface AppShellProps extends AgentTargetProps {
  sidebarMode?: SidebarMode;
  narrow?: boolean;
  contextVisible?: boolean;
}
