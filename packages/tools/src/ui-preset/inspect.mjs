import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { collectSourceFiles, readText } from "./files.mjs";
import { findModuleSpecifiers } from "./imports.mjs";
import {
  DEFAULT_UI_FILES,
  MANAGED_PRESET_END,
  MANAGED_PRESET_START,
  UI_LAYER_PACKAGES,
  UI_SHARED_PACKAGES,
  isLayerSpecifier,
} from "./definitions.mjs";

const execFileAsync = promisify(execFile);

export async function inspectUiProject(projectRoot = process.cwd(), options = {}) {
  const manifestSource = await readText(join(projectRoot, "package.json"));
  if (manifestSource === null) throw new Error(`Missing required file: ${join(projectRoot, "package.json")}`);
  const appConfigSource = await readText(join(projectRoot, options.appConfigPath ?? "app.config.json"));
  const manifest = parseJson(manifestSource, "package.json");
  const appConfig = appConfigSource === null ? {} : parseJson(appConfigSource, options.appConfigPath ?? "app.config.json");
  const git = await inspectGit(projectRoot);
  const files = await collectSourceFiles(projectRoot, options.sourceRoots);
  const imports = await inspectImports(projectRoot, files);
  const dependencies = manifest.dependencies ?? {};
  const resolutions = manifest.resolutions ?? {};
  const declared = declaredPreset(dependencies);
  const facade = facadePreset(imports);
  const configured = configuredPreset(appConfig);
  const managed = await readManagedPreset(projectRoot) ?? "unknown";
  const source = dependencySource(dependencies, resolutions, declared);
  const revision = workspaceRevision(dependencies, declared);
  const drift = buildDrift({ dependencies, declared, facade, configured, managed, imports, source });

  return {
    schemaVersion: 1,
    projectRoot,
    manifest,
    manifestSource,
    appConfig,
    appConfigSource,
    git,
    files,
    imports,
    current: { preset: declared, facade, configured, managed, source, revision: revision.value },
    drift,
    status: drift.length ? "needs_attention" : "ready",
  };
}

async function inspectImports(projectRoot, files) {
  const imports = [];
  for (const path of files) {
    const source = await readText(join(projectRoot, path), "");
    try {
      for (const item of findModuleSpecifiers(source, path)) {
        if (item.dynamic && item.value.includes("@lilia/")) {
          imports.push({
            path,
            parseError: "Cannot safely resolve an interpolated @lilia dynamic import.",
          });
          continue;
        }
        if (isLayerSpecifier(item.value)) {
          imports.push({ path, specifier: item.value, start: item.start, end: item.end });
        }
      }
    } catch (error) {
      imports.push({ path, parseError: error.message });
    }
  }
  return imports;
}

function declaredPreset(dependencies) {
  const lilia = dependencies[UI_LAYER_PACKAGES.lilia] !== undefined;
  const nana = dependencies[UI_LAYER_PACKAGES.nana] !== undefined;
  if (lilia && nana) return "conflict";
  if (lilia) return "lilia";
  if (nana) return "nana";
  return "unknown";
}

function facadePreset(imports) {
  const layers = new Set(imports
    .filter((item) => item.path?.startsWith("src/ui/") && item.specifier)
    .map((item) => item.specifier.startsWith("@lilia/nana-ui") ? "nana" : "lilia"));
  if (layers.size > 1) return "conflict";
  return [...layers][0] ?? "unknown";
}

function configuredPreset(appConfig) {
  return appConfig?.ui?.preset ?? "unknown";
}

function dependencySource(dependencies, resolutions, declared) {
  const names = relevantPackages(declared);
  const kinds = new Set(names.flatMap((name) => {
    const specifier = resolutions[name] ?? dependencies[name];
    return specifier ? [classifySource(specifier)] : [];
  }));
  if (kinds.size > 1) return "mixed";
  return [...kinds][0] ?? "remote";
}

function classifySource(specifier) {
  return /^(?:file|link|portal|workspace):/.test(specifier) ? "local" : "remote";
}

function buildDrift(context) {
  const drift = [];
  if (["unknown", "conflict"].includes(context.declared)) {
    drift.push(issue("layer-dependency", "error", `UI dependency state is ${context.declared}.`));
  }
  if (context.facade !== context.declared) {
    drift.push(issue("facade-preset", "error", `Facade=${context.facade}, dependency=${context.declared}.`));
  }
  if (context.configured !== context.declared) {
    drift.push(issue("config-preset", "error", `Config=${context.configured}, dependency=${context.declared}.`));
  }
  if (context.managed !== "unknown" && context.managed !== context.declared) {
    drift.push(issue("managed-preset", "error", `Managed preset=${context.managed}, dependency=${context.declared}.`));
  }
  for (const name of UI_SHARED_PACKAGES) {
    if (context.dependencies[name] === undefined) {
      drift.push(issue("shared-dependency", "error", `Missing ${name}.`, ["package.json"]));
    }
  }
  if (context.source === "mixed") {
    drift.push(issue("dependency-source", "error", "UI package sources are mixed between local and remote."));
  }
  const revision = workspaceRevision(context.dependencies, context.declared);
  if (!revision.ok) drift.push(issue("workspace-revision", "error", revision.detail, ["package.json"]));
  const direct = context.imports.filter((item) => item.specifier && !item.path.startsWith("src/ui/"));
  if (direct.length) {
    drift.push(issue("direct-layer-import", "warning", `${direct.length} files bypass the UI facade.`, [...new Set(direct.map((item) => item.path))]));
  }
  for (const failed of context.imports.filter((item) => item.parseError)) {
    drift.push(issue("parse-error", "error", failed.parseError, [failed.path]));
  }
  return drift;
}

function workspaceRevision(dependencies, declared) {
  const names = relevantPackages(declared);
  const specs = names.map((name) => [name, dependencies[name]]);
  const usesGitWorkspace = specs.some(([, specifier]) =>
    typeof specifier === "string" && specifier.includes("workspace="));
  if (!usesGitWorkspace) return { ok: true, value: null };
  const revisions = specs.map(([name, specifier]) => {
    const match = /(?:[?&#]|^)commit=([^&#]+)/.exec(specifier ?? "");
    return [name, match?.[1] ?? null];
  });
  const missing = revisions.filter(([, revision]) => revision === null).map(([name]) => name);
  const values = new Set(revisions.flatMap(([, revision]) => revision ? [revision] : []));
  if (missing.length) {
    return {
      ok: false,
      value: "unpinned",
      detail: `Git workspace packages must use commit=<sha>; missing: ${missing.join(", ")}.`,
    };
  }
  if (values.size !== 1) {
    return { ok: false, value: "mixed", detail: "UI Layer, Contract, and Foundation use different commits." };
  }
  return { ok: true, value: [...values][0] };
}

function relevantPackages(declared) {
  const layers = declared === "lilia" || declared === "nana"
    ? [UI_LAYER_PACKAGES[declared]]
    : Object.values(UI_LAYER_PACKAGES);
  return [...layers, ...UI_SHARED_PACKAGES];
}

function issue(id, severity, detail, files = []) {
  return { id, severity, detail, files };
}

async function readManagedPreset(projectRoot) {
  for (const path of DEFAULT_UI_FILES.filter((item) => item.endsWith("preset.ts"))) {
    const source = await readText(join(projectRoot, path));
    if (!source) continue;
    const start = source.indexOf(MANAGED_PRESET_START);
    const end = source.indexOf(MANAGED_PRESET_END);
    if (start < 0 || end < start) continue;
    const block = source.slice(start, end);
    const match = /appUIPresetId\s*=\s*["'](lilia|nana)["']/.exec(block);
    if (match) return match[1];
  }
  return null;
}

async function inspectGit(projectRoot) {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd: projectRoot });
    return { available: true, dirty: stdout.trim().length > 0, entries: stdout.trim().split("\n").filter(Boolean) };
  } catch {
    return { available: false, dirty: null, entries: [] };
  }
}

function parseJson(source, path) {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Cannot parse JSON ${path}: ${error.message}`);
  }
}
