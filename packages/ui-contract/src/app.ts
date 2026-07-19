import type { UIPolicy, UIPreset } from "./policy";

export interface AppShellSlots<TContent = unknown> {
  default?: () => TContent;
  "header-leading"?: () => TContent;
  "header-center"?: () => TContent;
  "header-actions"?: () => TContent;
  overlays?: () => TContent;
}

export interface AppUIPresetAdapter<TShell = unknown, TProvider = unknown> extends UIPreset {
  shell: TShell;
  provider: TProvider;
}

export interface UIProviderValue<TPolicy = Readonly<UIPolicy>> {
  readonly policy: TPolicy;
  setPolicy: (patch: Partial<UIPolicy>) => void;
  replacePolicy: (next?: Partial<UIPolicy>) => void;
  resetPolicy: () => void;
}
