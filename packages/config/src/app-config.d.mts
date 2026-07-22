export type AppUIPreset = "lilia";
export type AppUIDensity = "comfortable" | "compact";
export type AppUIAccent = "blue";

export interface AppUIConfig {
  preset: AppUIPreset;
  density?: AppUIDensity;
  accent?: AppUIAccent;
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
  onboarding?: AppOnboardingConfig;
  [key: string]: unknown;
}

export const APP_UI_PRESETS: readonly AppUIPreset[];
export const APP_UI_DENSITIES: readonly AppUIDensity[];
export const APP_UI_ACCENTS: readonly AppUIAccent[];

export function defineAppConfig<const T extends AppConfig>(config: T): T;
export function validateAppConfig(config: unknown): asserts config is AppConfig;
