export type UIDensity = "comfortable" | "compact";
export type UIControlSize = "sm" | "md" | "lg";
export type UIIntent = "default" | "primary" | "warning" | "danger";
export type UIStatusTone = "neutral" | "info" | "success" | "warning" | "error";
export type UIOrientation = "horizontal" | "vertical";
export type MaybePromise<T> = T | Promise<T>;

export interface AgentTargetProps {
  agentId?: string;
}

export interface AccessibleLabelProps {
  ariaLabel?: string;
  ariaDescribedby?: string;
}

export interface ControlStateProps extends AgentTargetProps {
  disabled?: boolean;
  loading?: boolean;
  invalid?: boolean;
}

export interface SelectableStateProps {
  selected?: boolean;
  expanded?: boolean;
}
