import type { AppUIPresetAdapter } from "@lilia/ui-contract";
import LiliaDesktopShell from "./layouts/LegacyAppShell.vue";
import { liliaPresetDefinition } from "./preset-definition";

export { defaultLiliaPolicy, liliaPresetDefinition } from "./preset-definition";

export const liliaPresetAdapter: AppUIPresetAdapter = {
  ...liliaPresetDefinition,
  shell: LiliaDesktopShell,
};
