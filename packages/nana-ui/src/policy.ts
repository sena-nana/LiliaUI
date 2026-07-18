import type { UIPolicy } from "@lilia/ui-contract";

export const defaultNanaPolicy: Readonly<UIPolicy> = Object.freeze({
  density: "comfortable",
  advancedDisclosure: "collapsed",
  errorPresentation: "recovery-first",
  selectionPresentation: "filled",
  feedbackStrength: "reinforced",
  sidebarDefault: "expanded",
  destructiveAction: "confirm-or-undo",
});

export function resolveNanaPolicy(policy?: Partial<UIPolicy>): UIPolicy {
  return { ...defaultNanaPolicy, ...policy };
}
