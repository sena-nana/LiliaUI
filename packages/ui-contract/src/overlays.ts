import type { AgentTargetProps, ControlStateProps } from "./common";

export interface OpenStateProps {
  open: boolean;
}

export type DialogSize = "compact" | "default" | "medium" | "wide" | "workspace";

export interface DialogProps extends OpenStateProps, AgentTargetProps {
  title: string;
  description?: string;
  size?: DialogSize;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
  closeDisabled?: boolean;
  closeAgentId?: string;
  closeLabel?: string;
  initialFocus?: "dialog" | "first-action";
}
export interface OpenStateEmits {
  "update:open": [open: boolean];
  close: [];
}
export interface DialogSlots {
  title?: () => unknown;
  default?: () => unknown;
  footer?: () => unknown;
  actions?: () => unknown;
}

export interface DrawerProps extends DialogProps {
  side?: "left" | "right" | "bottom";
}

export interface PopoverProps extends OpenStateProps, AgentTargetProps {
  ariaLabel?: string;
  placement?: "top" | "right" | "bottom" | "left";
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
}

export interface TooltipProps extends AgentTargetProps {
  text?: string;
  open?: boolean;
  delayMs?: number;
  placement?: "top" | "right" | "bottom" | "left";
}
export interface TooltipSlots {
  trigger?: (props: { describedBy?: string }) => unknown;
  default?: () => unknown;
}

export interface OverlayAction extends ControlStateProps {
  id: string;
  label: string;
  destructive?: boolean;
}
