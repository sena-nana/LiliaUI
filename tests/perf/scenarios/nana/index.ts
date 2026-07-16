import type { ComponentPerfScenario } from "../../componentScenarios";
import { nanaControlScenarios } from "./controls";
import { nanaFeedbackScenarios } from "./feedback";
import { nanaFormSurfaceScenarios } from "./formsSurfaces";
import { nanaOverlayScenarios } from "./overlays";
import { nanaShellScenarios } from "./shell";

export const nanaComponentScenarios: ComponentPerfScenario[] = [
  ...nanaControlScenarios,
  ...nanaFormSurfaceScenarios,
  ...nanaFeedbackScenarios,
  ...nanaOverlayScenarios,
  ...nanaShellScenarios,
];
