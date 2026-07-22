export const APP_UI_PRESETS = Object.freeze(["lilia"]);
export const APP_UI_DENSITIES = Object.freeze(["comfortable", "compact"]);
export const APP_UI_ACCENTS = Object.freeze(["blue"]);

const REQUIRED_METADATA = [
  "appName",
  "productTitle",
  "version",
  "identifier",
  "storageKeyPrefix",
];

export function defineAppConfig(config) {
  validateAppConfig(config);
  return config;
}

export function validateAppConfig(config) {
  assertRecord(config, "app.config.json");

  for (const key of REQUIRED_METADATA) {
    assertNonEmptyString(config[key], key);
  }

  if (config.ui !== undefined) {
    validateUiConfig(config.ui);
  }
  if (config.layout !== undefined) {
    throw new Error('app.config.json does not support "layout".');
  }
  if (config.onboarding !== undefined) {
    validateOnboardingConfig(config.onboarding);
  }
}

function validateUiConfig(ui) {
  assertRecord(ui, "ui");
  assertAllowedKeys(ui, ["preset", "density", "accent"], "ui");
  assertEnum(ui.preset, APP_UI_PRESETS, "ui.preset");

  if (ui.density !== undefined) {
    assertEnum(ui.density, APP_UI_DENSITIES, "ui.density");
  }
  if (ui.accent !== undefined) {
    assertEnum(ui.accent, APP_UI_ACCENTS, "ui.accent");
  }
}

function validateOnboardingConfig(onboarding) {
  assertRecord(onboarding, "onboarding");
  assertAllowedKeys(onboarding, ["enabled"], "onboarding");
  if (typeof onboarding.enabled !== "boolean") {
    throw new Error('app.config.json requires a boolean "onboarding.enabled".');
  }
}

function assertAllowedKeys(value, allowedKeys, keyPath) {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  if (unknownKey !== undefined) {
    throw new Error(`app.config.json does not support "${keyPath}.${unknownKey}".`);
  }
}

function assertEnum(value, allowedValues, keyPath) {
  if (!allowedValues.includes(value)) {
    throw new Error(
      `app.config.json requires "${keyPath}" to be one of: ${allowedValues.join(", ")}.`,
    );
  }
}

function assertNonEmptyString(value, keyPath) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`app.config.json requires a non-empty string "${keyPath}".`);
  }
}

function assertRecord(value, keyPath) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`app.config.json requires an object "${keyPath}".`);
  }
}
