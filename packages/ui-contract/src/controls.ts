import type {
  AccessibleLabelProps,
  AgentTargetProps,
  ControlStateProps,
  UIControlSize,
  UIIntent,
} from "./common";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "text" | "danger";

export interface ButtonProps extends ControlStateProps {
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: UIControlSize;
}
export interface ButtonEmits { click: [event: MouseEvent] }
export interface ButtonSlots { default?: () => unknown; icon?: () => unknown }

export interface IconButtonProps extends ButtonProps, AccessibleLabelProps {
  label: string;
  tooltip?: string;
  active?: boolean;
}

export interface InputProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: string | number;
  type?: string;
  name?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: UIControlSize;
}
export interface InputEmits {
  "update:modelValue": [value: string];
  input: [event: Event];
}

export interface TextareaProps extends InputProps {
  rows?: number;
  resize?: "none" | "vertical" | "both";
}
export interface TextareaEmits extends InputEmits {}

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T = string | number> extends ControlStateProps, AccessibleLabelProps {
  modelValue?: T;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  size?: UIControlSize;
}
export interface SelectEmits<T = string | number> {
  "update:modelValue": [value: T];
  change: [event: Event];
}

export interface CheckboxProps extends ControlStateProps {
  modelValue?: boolean;
  indeterminate?: boolean;
  label?: string;
}
export interface CheckboxEmits {
  "update:modelValue": [value: boolean];
  change: [event: Event];
}

export interface SwitchProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: boolean;
  label?: string;
}
export interface SwitchEmits extends CheckboxEmits {}

export interface SliderProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
}
export interface SliderEmits {
  "update:modelValue": [value: number];
  input: [event: Event];
  change: [event: Event];
}

export type XYPadValue = { x: number; y: number };

export interface XYPadProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: XYPadValue;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** When > 0, quantize both axes to this step. */
  step?: number;
  /** When true, pad top maps to yMax (default). */
  yIncreasesUp?: boolean;
  /** When true, holding Shift locks to the dominant drag axis (default). */
  lockAxisWithShift?: boolean;
}
export interface XYPadEmits {
  "update:modelValue": [value: XYPadValue];
  input: [event: Event];
  change: [event: Event];
}

export interface FormFieldProps extends AgentTargetProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  controlId?: string;
}

export interface ValidationMessageProps extends AgentTargetProps {
  message: string;
  intent?: Extract<UIIntent, "warning" | "danger">;
}
