import type { AppUIPresetAdapter } from "@lilia/ui-contract";
import NanaUIProvider from "./provider/NanaUIProvider.vue";
import { nanaPresetDefinition } from "./preset-definition";
import NanaAppShell from "./shell/NanaAppShell.vue";

export const nanaPresetAdapter: AppUIPresetAdapter = {
  ...nanaPresetDefinition,
  shell: NanaAppShell,
  provider: NanaUIProvider,
};

export { createNanaPresetDefinition, nanaPresetDefinition } from "./preset-definition";
