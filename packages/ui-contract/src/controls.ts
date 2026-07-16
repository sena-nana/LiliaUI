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

export interface IconButtonProps extends ButtonProps, AccessibleLabelProps {
  label: string;
  tooltip?: string;
  active?: boolean;
}

export interface InputProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: string | number;
  name?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: UIControlSize;
}

export interface TextareaProps extends InputProps {
  rows?: number;
  resize?: "none" | "vertical" | "both";
}

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

export interface CheckboxProps extends ControlStateProps {
  modelValue?: boolean;
  indeterminate?: boolean;
  label?: string;
}

export interface SwitchProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: boolean;
  label?: string;
}

export interface SliderProps extends ControlStateProps, AccessibleLabelProps {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
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
