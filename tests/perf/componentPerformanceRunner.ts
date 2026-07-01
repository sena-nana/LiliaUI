import { createApp, defineComponent, nextTick, ref } from "vue";
import {
  componentPerformanceScenarios,
  type ComponentPerfScenario,
} from "./componentScenarios";

export interface ComponentPerfSample {
  domNodes: number;
  interaction: number;
  mount: number;
  unmount: number;
  update: number;
}

export interface ComponentPerfPhaseSummary {
  median: number;
  p95: number;
}

export interface ComponentPerfScenarioSummary {
  domNodes: ComponentPerfPhaseSummary;
  interaction: ComponentPerfPhaseSummary;
  mount: ComponentPerfPhaseSummary;
  unmount: ComponentPerfPhaseSummary;
  update: ComponentPerfPhaseSummary;
}

export interface ComponentPerfReport {
  generatedAt: string;
  iterations: number;
  runner: "browser" | "vitest-jsdom";
  schemaVersion: 1;
  scenarios: Record<string, ComponentPerfScenarioSummary>;
  thresholds: ComponentPerfThresholds;
}

export interface ComponentPerfThresholds {
  domNodeRegressionFloor: number;
  domNodeRegressionRatio: number;
  durationRegressionFloorMs: number;
  durationRegressionRatio: number;
}

export const defaultComponentPerfThresholds: ComponentPerfThresholds = {
  domNodeRegressionFloor: 8,
  domNodeRegressionRatio: 1.25,
  durationRegressionFloorMs: 20,
  durationRegressionRatio: 4,
};

function now() {
  return performance.now();
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return Number(sorted[index].toFixed(3));
}

function summarize(values: number[]): ComponentPerfPhaseSummary {
  return {
    median: percentile(values, 0.5),
    p95: percentile(values, 0.95),
  };
}

function summarizeScenario(samples: ComponentPerfSample[]): ComponentPerfScenarioSummary {
  return {
    domNodes: summarize(samples.map((sample) => sample.domNodes)),
    interaction: summarize(samples.map((sample) => sample.interaction)),
    mount: summarize(samples.map((sample) => sample.mount)),
    unmount: summarize(samples.map((sample) => sample.unmount)),
    update: summarize(samples.map((sample) => sample.update)),
  };
}

function clearPerfDom() {
  document.body.innerHTML = "";
}

function countDomNodes() {
  return document.body.querySelectorAll("*").length;
}

async function runOneSample(scenario: ComponentPerfScenario, iteration: number) {
  clearPerfDom();
  scenario.prepare?.();

  const container = document.createElement("div");
  container.dataset.perfRoot = scenario.name;
  document.body.append(container);
  const step = ref(iteration);
  const root = defineComponent({
    name: `${scenario.name}PerfRoot`,
    setup() {
      return () => scenario.render(step);
    },
  });
  const app = createApp(root);
  for (const plugin of scenario.createPlugins?.() ?? []) {
    app.use(plugin);
  }
  await scenario.beforeMount?.();

  const mountStart = now();
  app.mount(container);
  await nextTick();
  const mount = now() - mountStart;

  const updateStart = now();
  step.value += 1;
  await nextTick();
  const update = now() - updateStart;

  const interactionStart = now();
  await scenario.interact?.(container);
  await nextTick();
  const interaction = now() - interactionStart;
  const domNodes = countDomNodes();

  const unmountStart = now();
  app.unmount();
  await nextTick();
  const unmount = now() - unmountStart;
  container.remove();
  scenario.cleanup?.();
  clearPerfDom();

  return {
    domNodes,
    interaction,
    mount,
    unmount,
    update,
  } satisfies ComponentPerfSample;
}

export async function runComponentPerformanceSuite(options: {
  iterations?: number;
  runner: ComponentPerfReport["runner"];
}): Promise<ComponentPerfReport> {
  const iterations = options.iterations ?? 9;
  const scenarios: ComponentPerfReport["scenarios"] = {};

  for (const scenario of componentPerformanceScenarios) {
    const samples: ComponentPerfSample[] = [];
    await runOneSample(scenario, -1);
    for (let index = 0; index < iterations; index += 1) {
      samples.push(await runOneSample(scenario, index));
    }
    scenarios[scenario.name] = summarizeScenario(samples);
  }

  return {
    generatedAt: new Date().toISOString(),
    iterations,
    runner: options.runner,
    schemaVersion: 1,
    scenarios,
    thresholds: defaultComponentPerfThresholds,
  };
}

export function compareComponentPerfReport(
  actual: ComponentPerfReport,
  baseline: ComponentPerfReport,
) {
  const thresholds = baseline.thresholds ?? defaultComponentPerfThresholds;
  const regressions: Array<{
    actual: number;
    allowed: number;
    baseline: number;
    metric: string;
    scenario: string;
  }> = [];
  for (const [scenarioName, actualSummary] of Object.entries(actual.scenarios)) {
    const baselineSummary = baseline.scenarios[scenarioName];
    if (!baselineSummary) continue;
    for (const phase of ["mount", "update", "interaction", "unmount"] as const) {
      const baselineValue = baselineSummary[phase].p95;
      const actualValue = actualSummary[phase].p95;
      const allowed = baselineValue * thresholds.durationRegressionRatio + thresholds.durationRegressionFloorMs;
      if (actualValue > allowed) {
        regressions.push({
          actual: actualValue,
          allowed: Number(allowed.toFixed(3)),
          baseline: baselineValue,
          metric: `${phase}.p95`,
          scenario: scenarioName,
        });
      }
    }
    const baselineDomNodes = baselineSummary.domNodes.p95;
    const actualDomNodes = actualSummary.domNodes.p95;
    const allowedDomNodes = baselineDomNodes * thresholds.domNodeRegressionRatio + thresholds.domNodeRegressionFloor;
    if (actualDomNodes > allowedDomNodes) {
      regressions.push({
        actual: actualDomNodes,
        allowed: Number(allowedDomNodes.toFixed(3)),
        baseline: baselineDomNodes,
        metric: "domNodes.p95",
        scenario: scenarioName,
      });
    }
  }
  return regressions;
}
