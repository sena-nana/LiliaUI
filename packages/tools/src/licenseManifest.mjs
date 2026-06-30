import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BRANCH = "main";

export function readLicenseJson(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function toHttpsRepoUrl(rawUrl) {
  if (!rawUrl) return "";
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return "";

  let normalized = trimmed.replace(/^git\+/, "").replace(/\/$/, "").replace(/\.git$/, "");
  if (/^git@[^:]+:/.test(normalized)) {
    normalized = normalized.replace(/^git@([^:]+):(.+)$/, "https://$1/$2");
  } else if (normalized.startsWith("ssh://")) {
    normalized = normalized.replace(/^ssh:\/\//, "https://");
  }

  return normalized;
}

export function normalizeRepositoryUrl(raw) {
  if (typeof raw === "string") return toHttpsRepoUrl(raw);
  if (raw && typeof raw === "object" && typeof raw.url === "string") return toHttpsRepoUrl(raw.url);
  return "";
}

export function normalizeLicense(raw, unknownLicense = "Undeclared") {
  if (typeof raw === "string") return raw.trim() || unknownLicense;
  if (Array.isArray(raw)) {
    const values = raw
      .map((item) => normalizeLicense(item, unknownLicense))
      .filter((item) => item && item !== unknownLicense);
    if (values.length === 0) return unknownLicense;
    return [...new Set(values)].sort().join("/");
  }
  if (raw && typeof raw === "object") {
    if (typeof raw.type === "string" && raw.type.trim()) return raw.type.trim();
    if (typeof raw.name === "string" && raw.name.trim()) return raw.name.trim();
  }
  return unknownLicense;
}

function normalizePath(p) {
  return path.resolve(p).replace(/\\/g, "/");
}

function summarizeByLicense(items, unknownLicense) {
  const map = new Map();
  for (const item of items) {
    const key = normalizeLicense(item.license || unknownLicense, unknownLicense);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function findPackageJsonPath(projectRoot, dependencyName) {
  const candidates = [
    path.resolve(projectRoot, "node_modules", dependencyName, "package.json"),
    path.resolve(projectRoot, "..", "node_modules", dependencyName, "package.json"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function collectNpmDependencies(projectRoot, packageJson, unknownLicense = "Undeclared") {
  const collected = new Map();

  const addFromSection = (deps = {}) => {
    for (const [name, req] of Object.entries(deps)) {
      if (collected.has(name)) continue;
      const localPackage = readLicenseJson(findPackageJsonPath(projectRoot, name) || "", null);
      collected.set(name, {
        name,
        version: localPackage?.version ?? String(req),
        license: normalizeLicense(localPackage?.license, unknownLicense),
      });
    }
  };

  addFromSection(packageJson.dependencies);
  addFromSection(packageJson.devDependencies);

  return [...collected.values()].sort((left, right) => left.name.localeCompare(right.name, "en"));
}

export function collectRustDependencies(projectRoot, cargoManifestPath, unknownLicense = "Undeclared") {
  const manifestPath = path.resolve(projectRoot, cargoManifestPath);
  const metadataRaw = execFileSync(
    "cargo",
    ["metadata", "--offline", "--format-version", "1", "--manifest-path", manifestPath],
    { cwd: projectRoot, encoding: "utf8", maxBuffer: 1024 * 1024 * 100 },
  );
  const metadata = JSON.parse(metadataRaw);
  const packages = metadata?.packages ?? [];
  const rootPath = normalizePath(manifestPath);
  const rootPackage = packages.find((pkg) => normalizePath(pkg.manifest_path) === rootPath);
  if (!rootPackage) {
    throw new Error(`Could not find cargo metadata package for ${cargoManifestPath}.`);
  }

  const byName = new Map();
  for (const pkg of packages) {
    if (!byName.has(pkg.name)) byName.set(pkg.name, pkg);
  }

  const directDeps = (rootPackage.dependencies ?? [])
    .filter((dep) => dep.kind === undefined || dep.kind === null || dep.kind === "normal" || dep.kind === "build" || dep.kind === "dev")
    .map((dep) => {
      const packageMeta = byName.get(dep.name) ?? {};
      return {
        name: dep.name,
        version: packageMeta.version ?? dep.req ?? unknownLicense,
        license: normalizeLicense(packageMeta.license, unknownLicense),
      };
    });

  return [...new Map(directDeps.map((dep) => [dep.name, dep])).values()].sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
}

function buildLicenseUrl(repositoryUrl, homepage) {
  const repoUrl = toHttpsRepoUrl(repositoryUrl);
  if (repoUrl) return `${repoUrl}/blob/${DEFAULT_BRANCH}/LICENSE`;
  const home = toHttpsRepoUrl(homepage);
  return home ? `${home}/blob/${DEFAULT_BRANCH}/LICENSE` : "";
}

export async function generateOpenSourceLicenseManifest(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const outputPath = path.resolve(
    projectRoot,
    options.outputPath ?? "src/generated/openSourceLicenseManifest.json",
  );
  const cargoManifestPath = options.cargoManifestPath ?? "src-tauri/Cargo.toml";
  const unknownLicense = options.unknownLicense ?? "Undeclared";
  const packageJson = readLicenseJson(path.resolve(projectRoot, "package.json"), {});
  const tauriConfig = readLicenseJson(path.resolve(projectRoot, "src-tauri/tauri.conf.json"), {});
  const repository = normalizeRepositoryUrl(packageJson.repository);

  const npmDependencies = collectNpmDependencies(projectRoot, packageJson, unknownLicense);
  const rustDependencies = collectRustDependencies(projectRoot, cargoManifestPath, unknownLicense);
  const manifest = {
    generatedAt: new Date().toISOString(),
    app: {
      name: tauriConfig?.productName || packageJson.name || options.fallbackAppName || "Lilia App",
      version: packageJson.version || tauriConfig?.version || options.fallbackVersion || "0.1.0",
      license: normalizeLicense(packageJson.license, unknownLicense),
      licenseUrl: buildLicenseUrl(repository, packageJson.homepage),
    },
    npmDependencies,
    rustDependencies,
    totals: {
      npm: summarizeByLicense(npmDependencies, unknownLicense),
      rust: summarizeByLicense(rustDependencies, unknownLicense),
    },
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, outputPath };
}
