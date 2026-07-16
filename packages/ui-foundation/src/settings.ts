import { defineAsyncComponent, inject, type App, type Component, type InjectionKey } from "vue";
import type { RouteLocationRaw } from "vue-router";

export type SettingsSectionLoader = () => Promise<{ default: Component }>;
export type SettingsSectionInput = Component | SettingsSectionLoader;

export interface SettingsTabInput {
  icon: Component;
  key: string;
  label: string;
  props?: Record<string, unknown>;
  to?: RouteLocationRaw;
}

export type SettingsTabKey = string;
export interface SettingsTab extends Omit<SettingsTabInput, "to"> { to: RouteLocationRaw }

export interface SettingsModelInput {
  aliases?: Record<string, string>;
  defaultTab: string;
  description?: string;
  fullPageTabs?: readonly string[];
  hideHeader?: boolean;
  path: string;
  sections: Record<string, SettingsSectionInput>;
  tabs: readonly SettingsTabInput[];
}

export interface SettingsModel {
  aliases: Readonly<Record<string, string>>;
  defaultTab: string;
  description?: string;
  fullPageTabs: ReadonlySet<string>;
  hideHeader: boolean;
  path: string;
  sectionProps: Readonly<Record<string, Record<string, unknown>>>;
  sections: Readonly<Record<string, Component>>;
  tabs: readonly SettingsTab[];
}

export const settingsKey: InjectionKey<SettingsModel> = Symbol("ui-settings");

export function createSettingsModel(input: SettingsModelInput): SettingsModel {
  const tabs = input.tabs.map((tab) => ({ ...tab, to: tab.to ?? { path: input.path, query: { tab: tab.key } } }));
  if (!tabs.some((tab) => tab.key === input.defaultTab)) throw new Error(`Unknown default settings tab: ${input.defaultTab}`);
  const sections = Object.fromEntries(Object.entries(input.sections).map(([key, section]) => [key, isLoader(section) ? defineAsyncComponent(section) : section]));
  for (const tab of tabs) if (!sections[tab.key]) throw new Error(`Missing settings section: ${tab.key}`);
  return {
    aliases: { ...input.aliases },
    defaultTab: input.defaultTab,
    description: input.description,
    fullPageTabs: new Set(input.fullPageTabs),
    hideHeader: input.hideHeader ?? false,
    path: input.path,
    sectionProps: Object.fromEntries(tabs.map((tab) => [tab.key, tab.props ?? {}])),
    sections,
    tabs,
  };
}

export function provideSettings(app: App, model: SettingsModel) { app.provide(settingsKey, model); return model; }
export function useSettings() { return inject(settingsKey, null); }
export function normalizeSettingsTab(model: SettingsModel, value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  const raw = typeof candidate === "string" ? candidate : "";
  const resolved = model.aliases[raw] ?? raw;
  return model.tabs.some((tab) => tab.key === resolved) ? resolved : model.defaultTab;
}

function isLoader(section: SettingsSectionInput): section is SettingsSectionLoader {
  return typeof section === "function" && !("setup" in section) && !("render" in section);
}

export {
  createSettingsModel as createLiliaSettingsModel,
  provideSettings as provideLiliaSettings,
  settingsKey as liliaSettingsKey,
  useSettings as useLiliaSettings,
  type SettingsModel as LiliaSettingsModel,
  type SettingsModelInput as LiliaSettingsModelInput,
  type SettingsSectionInput as LiliaSettingsSectionInput,
  type SettingsSectionLoader as LiliaSettingsSectionLoader,
  type SettingsTabInput as LiliaSettingsTabInput,
};
