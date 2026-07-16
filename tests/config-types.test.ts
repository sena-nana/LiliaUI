import {
  defineAppConfig,
  type AppConfig,
  type AppLayoutType,
  type AppUIPreset,
} from "@lilia/config";

const preset: AppUIPreset = "nana";
const layout: AppLayoutType = "nana-editor";

const config = defineAppConfig({
  appName: "nana-test",
  productTitle: "Nana Test",
  version: "0.1.0",
  identifier: "com.lilia.nana-test",
  storageKeyPrefix: "nana-test",
  ui: {
    preset,
    density: "comfortable",
    accent: "blue",
  },
  layout: {
    type: layout,
    sidebar: { collapsible: true },
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
  appName: "invalid-sidebar",
  productTitle: "Invalid Sidebar",
  version: "0.1.0",
  identifier: "com.lilia.invalid-sidebar",
  storageKeyPrefix: "invalid-sidebar",
  layout: {
    type: "nana-editor",
    sidebar: {
      // @ts-expect-error Sidebar collapsibility is a boolean contract.
      collapsible: "yes",
    },
  },
});
