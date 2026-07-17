import type { Component, Ref, ShallowRef } from "vue";

export type WorkspaceRegionRole =
  | "global-navigation"
  | "section-navigation"
  | "resources"
  | "primary"
  | "inspector"
  | "timeline"
  | "console"
  | "utility";

export type WorkspaceRegionPlacement = "start" | "end" | "top" | "bottom" | "primary";
export type WorkspaceRegionScope = "workspace" | "primary";
export type WorkspaceRegionOverflow = "auto" | "hidden" | "visible";
export type WorkspaceRegionNarrowBehavior = "shrink" | "collapse" | "overlay" | "none";

export interface LiliaWorkspaceRegionProps {
  id: string;
  role: WorkspaceRegionRole;
  placement?: WorkspaceRegionPlacement;
  side?: "start" | "end";
  scope?: WorkspaceRegionScope;
  as?: string | Component;
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  fillPriority?: number;
  overflow?: WorkspaceRegionOverflow;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  narrowBehavior?: WorkspaceRegionNarrowBehavior;
  collapseBelow?: number;
  responsivePriority?: number;
  resizeLabel?: string;
  resizeStep?: number;
}

export interface WorkspaceRegionGeometry {
  readonly id: string;
  readonly rect: Readonly<ShallowRef<DOMRectReadOnly | null>>;
  readonly safeRect: Readonly<ShallowRef<DOMRectReadOnly | null>>;
  readonly visible: Readonly<Ref<boolean>>;
  readonly stable: Readonly<Ref<boolean>>;
}
