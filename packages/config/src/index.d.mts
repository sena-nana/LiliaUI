import type { PluginOption, UserConfig, UserConfigExport } from "vite";
import type { AppConfig } from "./app-config.mjs";

export * from "./app-config.mjs";
export { calculateNextVersion } from "./version.mjs";

export interface LiliaViteConfigOptions {
  projectRoot?: string;
  appConfig?: AppConfig;
  envPrefix?: string;
  defaultPort?: number;
  hmrPort?: number;
  plugins?: PluginOption[];
  vite?: UserConfig;
  test?: Record<string, unknown>;
  server?: Record<string, unknown>;
}

export interface LiliaDocsConfigOptions {
  title?: string;
  description?: string;
  base?: string;
  nav?: unknown[];
  sidebar?: unknown[];
  socialLinks?: unknown[];
  themeConfig?: Record<string, unknown>;
  vitepress?: Record<string, unknown>;
}

export function readJson<T = unknown>(path: string): T;
export function readAppConfig(projectRoot?: string): AppConfig;
export function writeIfChanged(path: string, next: string): void;
export function syncFromAppConfig(appConfig: AppConfig, projectRoot?: string): void;
export function defineLiliaViteConfig(options?: LiliaViteConfigOptions): UserConfigExport;
export function defineLiliaDocsConfig(options?: LiliaDocsConfigOptions): Record<string, unknown>;
