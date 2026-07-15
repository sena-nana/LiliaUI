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

export type ComponentPerfRunner = "browser" | "vitest-jsdom";

export interface ComponentPerfThresholds {
  domNodeRegressionFloor: number;
  domNodeRegressionRatio: number;
  durationRegressionFloorMs: number;
  durationRegressionRatio: number;
}

export interface ComponentPerfReport {
  generatedAt: string;
  iterations: number;
  runner: ComponentPerfRunner;
  schemaVersion: 1;
  scenarios: Record<string, ComponentPerfScenarioSummary>;
  thresholds: ComponentPerfThresholds;
}

export interface ComponentPerfRegression {
  actual: number;
  allowed: number;
  baseline: number;
  metric: string;
  scenario: string;
}
