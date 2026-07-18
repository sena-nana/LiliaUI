import type { UIPolicy, UIPreset } from "@lilia/ui-contract";

export const defaultLiliaPolicy: Readonly<UIPolicy> = Object.freeze({
  density: "compact",
  advancedDisclosure: "visible",
  errorPresentation: "technical",
  selectionPresentation: "outline",
  feedbackStrength: "minimal",
  sidebarDefault: "expanded",
  destructiveAction: "application",
});

export const liliaPresetDefinition: UIPreset = {
  id: "lilia",
  policy: { ...defaultLiliaPolicy },
  defaultDensity: defaultLiliaPolicy.density,
  capabilities: ["professional-shell", "settings", "commands"],
};
