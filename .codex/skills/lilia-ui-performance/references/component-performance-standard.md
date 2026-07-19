# Component Performance Standard

## Scope

Treat every public Vue component exported from `packages/ui/src/index.ts` as part of the performance surface. Internal helpers and sidebar subcomponents should be covered through their public parent scenario unless they become public exports.

## Required Evidence

- Run `yarn perf:components:light` for public component, shell, settings, overlay, menu, search, input, or composable changes that can affect rendering.
- Run `yarn perf:components:browser` when layout, transition, Teleport, overlay positioning, global listeners, scroll/resize handling, or repeated user interaction can affect real browser responsiveness.
- Use `yarn perf:components:update-baseline` only after reviewing that the new baseline reflects an intended implementation change, not local noise.

## Scenario Design

- Cover the component's primary visible state and one meaningful state transition through the shared `perfStep`.
- Include a real DOM interaction when the component is interactive: click, input, change, or menu selection.
- Prefer existing public props, slots, router config, and composables over private hooks.
- Keep scenarios deterministic and compact; do not assert logs, exact text copies, or implementation-specific class churn unless that class is the stable interaction target.
- Use `data-agent-id` when the component already exposes one for stable interaction targeting.

## Regression Review

- Start with the component or composable that changed, then inspect callers and shared helpers with CodeGraph.
- Check for unnecessary reactive breadth, repeated router/config creation, unbounded list rendering, expensive computed work, global listeners active while hidden, observer/timer leaks, and transitions that alter layout.
- Prefer removing work, narrowing reactivity, lazy mounting, or cleanup fixes over raising thresholds.
- If a baseline must rise, explain which user-visible capability or real state now costs more.

## Design Constraints

- Performance data belongs in CLI reports, tests, and review notes, not in visible application UI.
- Disabled UI cannot stand in for unfinished performance work.
- Browser reports are evidence for review; the light benchmark is the default gate.
