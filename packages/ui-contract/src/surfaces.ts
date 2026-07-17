import type { AgentTargetProps, UIStatusTone } from "./common";

export type SurfaceMode = "solid" | "translucent";
export type BackdropEffect = "none" | "native" | "css-blur";
export type SurfaceLevel = "base" | "raised" | "floating" | "overlay";

export interface SurfaceProps extends AgentTargetProps {
  surfaceMode?: SurfaceMode;
  backdropEffect?: BackdropEffect;
  surfaceLevel?: SurfaceLevel;
  surfaceBoundary?: boolean;
}

export interface SurfaceDataAttributes {
  "data-lilia-surface-mode": SurfaceMode;
  "data-lilia-backdrop": BackdropEffect;
  "data-lilia-surface-level": SurfaceLevel;
  "data-lilia-surface-boundary"?: "";
}

export interface CardProps extends SurfaceProps {
  variant?: "default" | "outlined" | "raised" | "interactive";
  selected?: boolean;
  disabled?: boolean;
}

export interface InteractiveCardProps extends CardProps {
  pressed?: boolean;
}

export interface ListItemProps extends AgentTargetProps {
  active?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

export interface StatusBadgeProps extends AgentTargetProps {
  tone?: UIStatusTone;
  label: string;
}

export interface EmptyStateProps extends AgentTargetProps {
  title: string;
  description?: string;
}

export interface SkeletonProps extends AgentTargetProps {
  width?: string;
  height?: string;
  label?: string;
}
