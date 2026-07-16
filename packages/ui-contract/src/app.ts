import type { UIPolicy, UIPreset } from "./policy";

export interface AppUIPresetAdapter<TComponent = unknown> extends UIPreset {
  shell: TComponent;
  provider?: TComponent;
}

export interface UIProviderValue {
  policy: Readonly<UIPolicy>;
  setPolicy: (patch: Partial<UIPolicy>) => void;
}
