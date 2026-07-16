import { UI_SHARED_PACKAGES, layerPackage, otherPreset } from "./definitions.mjs";

export function createPackageJsonOperation(inspection, preset) {
  const manifest = structuredClone(inspection.manifest);
  const dependencies = { ...(manifest.dependencies ?? {}) };
  const targetPackage = layerPackage(preset);
  const inactivePackage = layerPackage(otherPreset(preset));
  const reference = dependencies[targetPackage]
    ?? dependencies[inactivePackage]
    ?? dependencies["@lilia/tools"];
  if (!reference) {
    return { error: {
      id: "dependency-reference",
      severity: "error",
      detail: "Cannot derive compatible UI dependency versions without an existing @lilia dependency.",
      files: ["package.json"],
    } };
  }
  if (reference.includes("workspace=") && !/(?:[?&#]|^)commit=([^&#]+)/.test(reference)) {
    return { error: {
      id: "dependency-reference",
      severity: "error",
      detail: "Git workspace dependency must use an immutable commit=<sha> reference.",
      files: ["package.json"],
    } };
  }
  delete dependencies[inactivePackage];
  dependencies[targetPackage] = derivePackageSpecifier(reference, targetPackage);
  for (const name of UI_SHARED_PACKAGES) {
    dependencies[name] = derivePackageSpecifier(reference, name);
  }
  manifest.dependencies = sortRecord(dependencies);
  updateResolutions(manifest, inspection, preset, reference);
  return operation(
    "package.json",
    inspection.manifestSource,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "dependencies",
  );
}

export function createAppConfigOperation(inspection, preset, path, defaultDensity) {
  const appConfig = structuredClone(inspection.appConfig);
  appConfig.ui = { ...(appConfig.ui ?? {}), preset, density: defaultDensity };
  return operation(
    path,
    inspection.appConfigSource,
    `${JSON.stringify(appConfig, null, 2)}\n`,
    "config",
  );
}

export function derivePackageSpecifier(reference, packageName) {
  if (reference.includes("workspace=")) {
    return reference.replace(/workspace=([^&#]+)/, (_, workspace) => {
      const encoded = /%2f/i.test(workspace);
      return `workspace=${encoded ? encodeURIComponent(packageName) : packageName}`;
    });
  }
  if (/^(?:file|link|portal):/.test(reference)) {
    const segment = packageName.slice("@lilia/".length);
    return reference.replace(/packages[\\/][^/\\#&]+/, `packages/${segment}`);
  }
  return reference;
}

function updateResolutions(manifest, inspection, preset, reference) {
  if (!manifest.resolutions) return;
  const resolutions = { ...manifest.resolutions };
  const targetPackage = layerPackage(preset);
  const inactivePackage = layerPackage(otherPreset(preset));
  const currentPackage = inspection.current.preset === "lilia" || inspection.current.preset === "nana"
    ? layerPackage(inspection.current.preset)
    : null;
  const sourceResolution = inspection.current.source === "local"
    ? (currentPackage ? resolutions[currentPackage] : null)
      ?? (/^(?:file|link|portal|workspace):/.test(reference) ? reference : null)
    : null;
  delete resolutions[targetPackage];
  delete resolutions[inactivePackage];
  if (sourceResolution) resolutions[targetPackage] = derivePackageSpecifier(sourceResolution, targetPackage);
  if (sourceResolution) {
    for (const name of UI_SHARED_PACKAGES) {
      resolutions[name] = derivePackageSpecifier(sourceResolution, name);
    }
  }
  manifest.resolutions = sortRecord(resolutions);
}

function sortRecord(record) {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

function operation(path, before, after, reason) {
  return { path, before, after, reason };
}
