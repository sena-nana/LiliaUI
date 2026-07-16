import {
  defineAsyncComponent,
  inject,
  type App,
  type Component,
  type InjectionKey,
} from "vue";
import type { RouteLocationRaw } from "vue-router";

export type LiliaSettingsSectionLoader = () => Promise<{ default: Component }>;
export type LiliaSettingsSectionInput = Component | LiliaSettingsSectionLoader;
export type SettingsTabKey = string;

export interface SettingsTab {
  icon: Component;
  key: SettingsTabKey;
  label: string;
  props?: Record<string, unknown>;
  to: RouteLocationRaw;
}

export interface LiliaSettingsTabInput {
  icon: Component;
  key: string;
  label: string;
  props?: Record<string, unknown>;
  to?: RouteLocationRaw;
}

export interface LiliaSettingsModelInput {
  aliases?: Record<string, string>;
  defaultTab: string;
  description?: string;
  fullPageTabs?: readonly string[];
  hideHeader?: boolean;
  path: string;
  sections: Record<string, LiliaSettingsSectionInput>;
  tabs: readonly LiliaSettingsTabInput[];
}

export interface LiliaSettingsModel {
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

export const liliaSettingsKey: InjectionKey<LiliaSettingsModel> = Symbol("lilia-settings");

export function createLiliaSettingsModel(input: LiliaSettingsModelInput): LiliaSettingsModel {
  const tabs = input.tabs.map((tab) => ({
    ...tab,
    to: tab.to ?? { path: input.path, query: { tab: tab.key } },
  }));
  if (!tabs.some((tab) => tab.key === input.defaultTab)) {
    throw new Error(`Unknown default settings tab: ${input.defaultTab}`);
  }
  const sections = Object.fromEntries(
    Object.entries(input.sections).map(([key, section]) => [key, resolveSettingsSection(section)]),
  );
  for (const tab of tabs) {
    if (!sections[tab.key]) throw new Error(`Missing settings section: ${tab.key}`);
  }
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

export function provideLiliaSettings(app: App, model: LiliaSettingsModel) {
  app.provide(liliaSettingsKey, model);
  return model;
}

export function useLiliaSettings(): LiliaSettingsModel | null {
  return inject(liliaSettingsKey, null);
}

export function normalizeSettingsTab(model: LiliaSettingsModel, value: unknown): SettingsTabKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  const raw = typeof candidate === "string" ? candidate : "";
  const resolved = model.aliases[raw] ?? raw;
  return model.tabs.some((tab) => tab.key === resolved) ? resolved : model.defaultTab;
}

function resolveSettingsSection(section: LiliaSettingsSectionInput): Component {
  return isSectionLoader(section) ? defineAsyncComponent(section) : section;
}

function isSectionLoader(section: LiliaSettingsSectionInput): section is LiliaSettingsSectionLoader {
  return typeof section === "function" && !("setup" in section) && !("render" in section);
}
