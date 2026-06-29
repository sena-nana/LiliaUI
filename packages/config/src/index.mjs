import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig as defineViteConfig } from "vite";
import { defineConfig as defineVitePressConfig } from "vitepress";

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

export function validateAppConfig(config) {
  const required = ["appName", "productTitle", "version", "identifier", "storageKeyPrefix"];
  for (const key of required) {
    assertNonEmptyString(config?.[key], key);
  }

  const shellRequired = [
    "homeTitle",
    "homeDescription",
    "workspaceSectionTitle",
    "statusLabel",
    "statusTitle",
    "settingsDescription",
  ];

  if (typeof config.shell !== "object" || config.shell === null) {
    throw new Error('app.config.json requires a "shell" object.');
  }
  for (const key of shellRequired) {
    assertNonEmptyString(config.shell[key], `shell.${key}`);
  }
}

export function syncFromAppConfig(appConfig, projectRoot = process.cwd()) {
  syncJson("package.json", (pkg) => {
    pkg.name = appConfig.appName;
    pkg.version = appConfig.version;
  }, projectRoot);

  syncJson("src-tauri/tauri.conf.json", (tauriConfig) => {
    tauriConfig.productName = appConfig.productTitle;
    tauriConfig.version = appConfig.version;
    tauriConfig.identifier = appConfig.identifier;
    tauriConfig.app.windows = tauriConfig.app.windows.map((windowConfig) => {
      if (windowConfig.label === "main") {
        return { ...windowConfig, title: appConfig.productTitle };
      }
      return windowConfig;
    });
  }, projectRoot);

  syncTomlValue("src-tauri/Cargo.toml", "version", appConfig.version, projectRoot);
}

export function calculateNextVersion(currentVersion, requestedVersion) {
  const current = parseVersion(currentVersion);
  if (!current) {
    throw new Error(`Invalid semantic version: ${currentVersion}`);
  }

  if (requestedVersion === "patch" || requestedVersion === "minor" || requestedVersion === "major") {
    return bump(current, requestedVersion);
  }

  const target = parseVersion(requestedVersion);
  if (!target) {
    throw new Error(`Invalid semantic version: ${requestedVersion}`);
  }
  if (!greaterThan(target, current)) {
    throw new Error(
      `The requested version ${requestedVersion} is not greater than current ${current.version}.`,
    );
  }
  return target.version;
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
      dedupe: unique(["vue", "vue-router", ...(resolve?.dedupe ?? [])]),
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
      ...(options.test ?? {}),
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

function syncTomlValue(relativePath, key, value, projectRoot) {
  const path = resolve(projectRoot, relativePath);
  const escaped = value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const next = readFileSync(path, "utf-8").replace(
    new RegExp(`^${key}\\s*=\\s*"[^"]*"`, "m"),
    `${key} = "${escaped}"`,
  );
  writeIfChanged(path, next);
}

function assertNonEmptyString(value, keyPath) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`app.config.json requires a non-empty string "${keyPath}".`);
  }
}

function bump(current, type) {
  const { major, minor, patch } = current;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "major") return `${major + 1}.0.0`;
  throw new Error(`Unsupported bump level: ${type}`);
}

function parseVersion(version) {
  const match = version?.match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) return null;
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    version: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

function greaterThan(a, b) {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
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
