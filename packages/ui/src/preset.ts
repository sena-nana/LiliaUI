import type { AppUIPresetAdapter, UIPolicy } from "@lilia/ui-contract";
import LiliaDesktopShell from "./layouts/AppShell.vue";

export const defaultLiliaPolicy: Readonly<UIPolicy> = Object.freeze({
  density: "compact",
  advancedDisclosure: "visible",
  errorPresentation: "technical",
  selectionPresentation: "outline",
  feedbackStrength: "minimal",
  sidebarDefault: "expanded",
  destructiveAction: "application",
});

export const liliaPresetAdapter: AppUIPresetAdapter = {
  id: "lilia",
  shell: LiliaDesktopShell,
  policy: { ...defaultLiliaPolicy },
  defaultDensity: defaultLiliaPolicy.density,
  capabilities: ["professional-shell", "settings", "commands"],
};
