import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig as defineViteConfig } from "vite";
import { defineConfig as defineVitePressConfig } from "vitepress";

export { calculateNextVersion } from "./version.mjs";
export {
  APP_LAYOUT_TYPES,
  APP_UI_ACCENTS,
  APP_UI_DENSITIES,
  APP_UI_PRESETS,
  defineAppConfig,
  validateAppConfig,
} from "./app-config.mjs";

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readAppConfig(projectRoot = process.cwd()) {
  return readJson(resolve(projectRoot, "app.config.json"));
}

export function writeIfChanged(path, next) {
  const current = readFileSync(path, "utf8");
  if (current !== next) {
    writeFileSync(path, next, "utf8");
  }
}

export function syncFromAppConfig(appConfig, projectRoot = process.cwd()) {
  syncJson("package.json", (pkg) => {
    pkg.name = appConfig.appName;
    pkg.version = appConfig.version;
  }, projectRoot);

  const syncTauriConfig = (tauriConfig) => {
    tauriConfig.productName = appConfig.productTitle;
    tauriConfig.version = appConfig.version;
    tauriConfig.identifier = appConfig.identifier;
    tauriConfig.app.windows = tauriConfig.app.windows.map((windowConfig) => {
      if (windowConfig.label === "main") {
        return { ...windowConfig, title: appConfig.productTitle };
      }
      return windowConfig;
    });
  };

  syncJson("src-tauri/tauri.conf.json", syncTauriConfig, projectRoot);
  syncJsonIfPresent("src-tauri/tauri.macos.conf.json", syncTauriConfig, projectRoot);

  syncTomlValue("src-tauri/Cargo.toml", "version", appConfig.version, projectRoot);
}

export function defineLiliaViteConfig(options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const appConfig = options.appConfig ?? readAppConfig(projectRoot);
  const envPrefix = options.envPrefix ?? toEnvPrefix(appConfig.appName);
  const host = process.env.TAURI_DEV_HOST;
  const devPort = Number.parseInt(process.env[`${envPrefix}_DEV_PORT`] ?? "", 10);
  const strictPort = process.env[`${envPrefix}_DEV_STRICT_PORT`] === "1";
  const port = Number.isInteger(devPort) ? devPort : (options.defaultPort ?? 1420);
  const { optimizeDeps, resolve, ...viteOptions } = options.vite ?? {};
  const testOptions = options.test ?? {};

  return defineViteConfig(() => ({
    plugins: [
      vue(),
      {
        name: "lilia-app-config-html",
        transformIndexHtml(html) {
          return html
            .replaceAll("%APP_PRODUCT_TITLE%", escapeHtml(appConfig.productTitle))
            .replaceAll("%APP_STORAGE_KEY_PREFIX%", escapeHtml(appConfig.storageKeyPrefix));
        },
      },
      ...(options.plugins ?? []),
    ],
    clearScreen: false,
    resolve: {
      ...(resolve ?? {}),
      dedupe: unique([
        "vue",
        "vue-router",
        "@lucide/vue",
        "vitest",
        "@testing-library/jest-dom",
        "@testing-library/vue",
        ...(resolve?.dedupe ?? []),
      ]),
    },
    optimizeDeps: {
      ...(optimizeDeps ?? {}),
      exclude: unique(["@lilia/ui", ...(optimizeDeps?.exclude ?? [])]),
    },
    server: {
      port,
      strictPort: strictPort || port === (options.defaultPort ?? 1420),
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: options.hmrPort ?? 1421,
          }
        : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
      ...(options.server ?? {}),
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./tests/setupTests.ts"],
      ...testOptions,
      execArgv: unique([
        "--no-experimental-webstorage",
        ...(testOptions.execArgv ?? []),
      ]),
    },
    ...viteOptions,
  }));
}

export function defineLiliaDocsConfig(options = {}) {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const isProjectPages = repository && !repository.endsWith(".github.io");
  const base = options.base ?? (process.env.GITHUB_ACTIONS && isProjectPages ? `/${repository}/` : "/");

  return defineVitePressConfig({
    title: options.title ?? "Lilia App",
    description: options.description ?? "A Lilia desktop application.",
    base,
    themeConfig: {
      nav: options.nav ?? [{ text: "开发启动", link: "/guide/development" }],
      sidebar: options.sidebar ?? [
        {
          text: "指南",
          items: [{ text: "开发启动", link: "/guide/development" }],
        },
      ],
      socialLinks: options.socialLinks ?? [],
      ...(options.themeConfig ?? {}),
    },
    ...(options.vitepress ?? {}),
  });
}

function syncJson(relativePath, update, projectRoot) {
  const path = resolve(projectRoot, relativePath);
  const data = readJson(path);
  update(data);
  writeIfChanged(path, `${JSON.stringify(data, null, 2)}\n`);
}

function syncJsonIfPresent(relativePath, update, projectRoot) {
  if (!existsSync(resolve(projectRoot, relativePath))) return;
  syncJson(relativePath, update, projectRoot);
}

function syncTomlValue(relativePath, key, value, projectRoot) {
  const path = resolve(projectRoot, relativePath);
  const escaped = value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const next = readFileSync(path, "utf-8").replace(
    new RegExp(`^${key}\\s*=\\s*"[^"]*"`, "m"),
    `${key} = "${escaped}"`,
  );
  writeIfChanged(path, next);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function toEnvPrefix(appName) {
  return appName.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function unique(values) {
  return [...new Set(values)];
}
