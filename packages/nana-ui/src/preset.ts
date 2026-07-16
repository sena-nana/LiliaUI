import type { AppUIPresetAdapter } from "@lilia/ui-contract";
import NanaUIProvider from "./provider/NanaUIProvider.vue";
import { nanaPreset } from "./provider/preset";
import NanaAppShell from "./shell/NanaAppShell.vue";

export const nanaPresetAdapter: AppUIPresetAdapter = {
  ...nanaPreset,
  shell: NanaAppShell,
  provider: NanaUIProvider,
};

export * from "./provider/preset";
