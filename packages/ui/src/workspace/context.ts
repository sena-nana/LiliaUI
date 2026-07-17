import type {
  ComputedRef,
  CSSProperties,
  InjectionKey,
  Ref,
  ShallowRef,
} from "vue";
import type {
  WorkspaceRegionNarrowBehavior,
  WorkspaceRegionPlacement,
  WorkspaceRegionRole,
  WorkspaceRegionScope,
} from "./types";

export interface WorkspaceGeometryState {
  id: string;
  rect: ShallowRef<DOMRectReadOnly | null>;
  safeRect: ShallowRef<DOMRectReadOnly | null>;
  visible: Ref<boolean>;
  stable: Ref<boolean>;
}

export interface WorkspaceRegionRegistration {
  key: symbol;
  id: string;
  order: number;
  element: ShallowRef<HTMLElement | null>;
  role: ComputedRef<WorkspaceRegionRole>;
  placement: ComputedRef<WorkspaceRegionPlacement>;
  scope: ComputedRef<WorkspaceRegionScope>;
  size: ComputedRef<number | null>;
  minSize: ComputedRef<number>;
  maxSize: ComputedRef<number>;
  fillPriority: ComputedRef<number>;
  narrowBehavior: ComputedRef<WorkspaceRegionNarrowBehavior>;
  collapseBelow: ComputedRef<number | null>;
  responsivePriority: ComputedRef<number>;
  requestedVisible: ComputedRef<boolean>;
}

export interface WorkspaceRegionLayout {
  style: CSSProperties;
  visible: boolean;
  overlay: boolean;
  separator: "inline" | "block" | null;
  edgeStart: boolean;
  edgeEnd: boolean;
  edgeTop: boolean;
  edgeBottom: boolean;
}

export interface WorkspaceLayoutModel {
  columns: string;
  rows: string;
  regions: ReadonlyMap<symbol, WorkspaceRegionLayout>;
  hasPrimary: boolean;
}

export interface WorkspaceContext {
  inlineSize: Readonly<Ref<number>>;
  layout: ComputedRef<WorkspaceLayoutModel>;
  registerRegion: (registration: WorkspaceRegionRegistration) => () => void;
  getGeometry: (id: string) => WorkspaceGeometryState;
  refreshLayout: () => void;
  refreshGeometry: () => void;
}

export const workspaceContextKey: InjectionKey<WorkspaceContext> = Symbol("liliaWorkspace");
