---
name: lilia-ui-performance
description: Evaluate and maintain LiliaUI public Vue component performance. Use when working in C:\Files\workspace\LiliaUI on component additions, UI interaction changes, shell/settings/overlay/list/search components, render responsiveness regressions, benchmark baseline updates, or requests to make performance part of LiliaUI design standards.
---

# LiliaUI Performance

Use this skill to keep component performance a design requirement, not a late verification step.

## Workflow

1. Read `AGENTS.md` and `DESIGN.md` before changing UI or performance code.
2. Use CodeGraph first when locating relevant components, composables, exports, and call paths.
3. Identify the root cause of a performance issue before changing code; do not hide symptoms with delays, disabled controls, or console-only checks.
4. For public component changes, update `tests/perf/componentScenarios.ts` when the component surface, important state, or primary interaction changes.
5. Run `yarn perf:components:light` before finalizing a UI performance change. Run `yarn perf:components:browser` when the change affects overlay positioning, shell layout, menus, search, transitions, global listeners, or repeated interactions.
6. Update the baseline only with `yarn perf:components:update-baseline`, and only after confirming the new numbers are expected.

## Standards

Read `references/component-performance-standard.md` when designing a new scenario, interpreting a regression, or deciding whether browser evidence is required.

## Output

Report the affected component scenarios, the command results, whether the baseline changed, and any remaining browser-only risk. Do not add performance explanations to the app UI.
