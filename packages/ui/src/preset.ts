import type { AppUIPresetAdapter } from "@lilia/ui-contract";
import LiliaAppShell from "./layouts/AppShell.vue";
import { liliaPresetDefinition } from "./preset-definition";
import LiliaUIProvider from "./provider/LiliaUIProvider.vue";

export { defaultLiliaPolicy, liliaPresetDefinition } from "./preset-definition";

export const liliaPresetAdapter: AppUIPresetAdapter = {
  ...liliaPresetDefinition,
  shell: LiliaAppShell,
  provider: LiliaUIProvider,
};
