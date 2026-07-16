import type { AgentTargetProps, UIStatusTone } from "./common";

export interface CardProps extends AgentTargetProps {
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
