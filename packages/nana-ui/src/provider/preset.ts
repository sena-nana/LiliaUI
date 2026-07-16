import type { UIPreset } from "@lilia/ui-contract";
import { defaultNanaPolicy, resolveNanaPolicy } from "./policy";

export function createNanaPreset(policy = defaultNanaPolicy): UIPreset {
  const resolved = resolveNanaPolicy(policy);
  return {
    id: "nana",
    policy: resolved,
    defaultDensity: resolved.density,
    capabilities: ["task-layout", "recovery", "progressive-settings", "undo-feedback"],
  };
}

export const nanaPreset = createNanaPreset();
