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

export type ComponentPerfRunner = "browser" | "vitest-jsdom";

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
  runner: ComponentPerfRunner;
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
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio));
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

async function measure(work: () => Promise<void> | void) {
  const start = now();
  await work();
  return now() - start;
}

async function runOneSample(scenario: ComponentPerfScenario) {
  clearPerfDom();
  const container = document.createElement("div");
  container.dataset.perfRoot = scenario.name;
  const step = ref(0);
  const root = defineComponent({
    name: `${scenario.name}PerfRoot`,
    setup() {
      return () => scenario.render(step);
    },
  });
  const app = createApp(root);
  const sample: ComponentPerfSample = {
    domNodes: 0,
    interaction: 0,
    mount: 0,
    unmount: 0,
    update: 0,
  };
  let mounted = false;

  try {
    scenario.prepare?.();
    document.body.append(container);
    for (const plugin of scenario.createPlugins?.() ?? []) {
      app.use(plugin);
    }
    await scenario.beforeMount?.();

    sample.mount = await measure(async () => {
      app.mount(container);
      mounted = true;
      await nextTick();
    });

    sample.update = await measure(async () => {
      step.value = 1;
      await nextTick();
    });

    const interact = scenario.interact;
    if (interact) {
      sample.interaction = await measure(async () => {
        await interact(container);
        await nextTick();
      });
    }
    sample.domNodes = countDomNodes();
  } finally {
    const unmountStart = now();
    if (mounted) {
      app.unmount();
      await nextTick();
    }
    sample.unmount = now() - unmountStart;
    container.remove();
    scenario.cleanup?.();
    clearPerfDom();
  }

  return sample;
}

export async function runComponentPerformanceSuite(options: {
  iterations?: number;
  runner: ComponentPerfRunner;
}): Promise<ComponentPerfReport> {
  const iterations = options.iterations ?? 9;
  const scenarios: ComponentPerfReport["scenarios"] = {};
  const suiteScenarios = componentPerformanceScenarios.filter((scenario) =>
    !scenario.runners || scenario.runners.includes(options.runner),
  );

  for (const scenario of suiteScenarios) {
    const samples: ComponentPerfSample[] = [];
    await runOneSample(scenario);
    for (let index = 0; index < iterations; index += 1) {
      samples.push(await runOneSample(scenario));
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

export function validateComponentPerfBaseline(
  actual: ComponentPerfReport,
  baseline: ComponentPerfReport,
) {
  const mismatches: string[] = [];
  if (baseline.runner !== actual.runner) {
    mismatches.push(`runner: expected ${actual.runner}, received ${baseline.runner}`);
  }
  if (baseline.schemaVersion !== actual.schemaVersion) {
    mismatches.push(
      `schemaVersion: expected ${actual.schemaVersion}, received ${baseline.schemaVersion}`,
    );
  }

  const actualScenarios = Object.keys(actual.scenarios).sort();
  const baselineScenarios = Object.keys(baseline.scenarios).sort();
  const missing = actualScenarios.filter((scenario) => !baseline.scenarios[scenario]);
  const stale = baselineScenarios.filter((scenario) => !actual.scenarios[scenario]);
  if (missing.length) {
    mismatches.push(`missing baseline scenarios: ${missing.join(", ")}`);
  }
  if (stale.length) {
    mismatches.push(`stale baseline scenarios: ${stale.join(", ")}`);
  }
  return mismatches;
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
