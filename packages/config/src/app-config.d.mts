export type AppUIPreset = "lilia" | "nana";
export type AppUIDensity = "comfortable" | "compact";
export type AppUIAccent = "blue";
export type AppLayoutType =
  | "nana-home"
  | "nana-editor"
  | "nana-settings"
  | "nana-onboarding";

export interface AppUIConfig {
  preset: AppUIPreset;
  density?: AppUIDensity;
  accent?: AppUIAccent;
}

export interface AppLayoutSidebarConfig {
  collapsible: boolean;
}

export interface AppLayoutConfig {
  type: AppLayoutType;
  sidebar?: AppLayoutSidebarConfig;
}

export interface AppOnboardingConfig {
  enabled: boolean;
}

export interface AppConfig {
  appName: string;
  productTitle: string;
  version: string;
  identifier: string;
  storageKeyPrefix: string;
  ui?: AppUIConfig;
  layout?: AppLayoutConfig;
  onboarding?: AppOnboardingConfig;
  [key: string]: unknown;
}

export const APP_UI_PRESETS: readonly AppUIPreset[];
export const APP_UI_DENSITIES: readonly AppUIDensity[];
export const APP_UI_ACCENTS: readonly AppUIAccent[];
export const APP_LAYOUT_TYPES: readonly AppLayoutType[];

export function defineAppConfig<const T extends AppConfig>(config: T): T;
export function validateAppConfig(config: unknown): asserts config is AppConfig;
