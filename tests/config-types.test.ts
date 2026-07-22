import {
  defineAppConfig,
  type AppConfig,
  type AppUIPreset,
} from "@lilia/config";

const preset: AppUIPreset = "lilia";

const config = defineAppConfig({
  appName: "lilia-test",
  productTitle: "Lilia Test",
  version: "0.1.0",
  identifier: "com.lilia.lilia-test",
  storageKeyPrefix: "lilia-test",
  ui: {
    preset,
    density: "comfortable",
    accent: "blue",
  },
  onboarding: { enabled: true },
  productMetadata: { channel: "stable" },
});

const typedConfig: AppConfig = config;
void typedConfig;

defineAppConfig({
  appName: "invalid-preset",
  productTitle: "Invalid Preset",
  version: "0.1.0",
  identifier: "com.lilia.invalid-preset",
  storageKeyPrefix: "invalid-preset",
  ui: {
    // @ts-expect-error UI presets are a closed contract.
    preset: "consumer",
  },
});

defineAppConfig({
  appName: "invalid-preset",
  productTitle: "Invalid Preset",
  version: "0.1.0",
  identifier: "com.lilia.invalid-preset",
  storageKeyPrefix: "invalid-preset",
  ui: {
    // @ts-expect-error Only "lilia" is a valid AppUIPreset.
    preset: "nana",
  },
});
