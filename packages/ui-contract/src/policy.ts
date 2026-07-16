import type { UIDensity } from "./common";

export interface UIPolicy {
  density: UIDensity;
  advancedDisclosure: "collapsed" | "visible";
  errorPresentation: "recovery-first" | "technical";
  selectionPresentation: "filled" | "outline";
  feedbackStrength: "reinforced" | "minimal";
  sidebarDefault: "expanded" | "icon";
  destructiveAction: "confirm-or-undo" | "application";
}

export interface UIPreset {
  id: "lilia" | "nana";
  policy: UIPolicy;
  defaultDensity: UIDensity;
  capabilities: readonly string[];
}
