import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as publicUiExports from "../../packages/ui/src/index";
import * as publicNanaExports from "../../packages/nana-ui/src/index";
import * as publicNanaFeedbackExports from "../../packages/nana-ui/src/feedback/index";
import * as publicNanaShellExports from "../../packages/nana-ui/src/shell/index";
import {
  type ComponentPerfReport,
  compareComponentPerfReport,
  runComponentPerformanceSuite,
  validateComponentPerfBaseline,
} from "./componentPerformanceRunner";
import { componentPerformanceScenarios } from "./componentScenarios";

const componentPerfBaselinePath = resolve("tests/perf/componentPerformance.baseline.json");
const vueComponentMarkers = ["__name", "setup", "render", "__asyncLoader"] as const;

function readComponentPerfBaseline() {
  return JSON.parse(readFileSync(componentPerfBaselinePath, "utf8")) as ComponentPerfReport;
}

function writeComponentPerfBaseline(report: ComponentPerfReport) {
  mkdirSync(dirname(componentPerfBaselinePath), { recursive: true });
  writeFileSync(componentPerfBaselinePath, `${JSON.stringify(report, null, 2)}\n`);
}

function isPublicVueComponent(value: unknown) {
  return typeof value === "object" &&
    value !== null &&
    vueComponentMarkers.some((marker) => marker in value);
}

function exportedVueComponentNames(exports: Record<string, unknown>) {
  return Object.entries(exports)
    .filter(([, value]) => isPublicVueComponent(value))
    .map(([name]) => name)
    .sort();
}

function missingScenarios(exports: Record<string, unknown>, scenarioNames: readonly string[]) {
  return exportedVueComponentNames(exports).filter((name) => {
    if (scenarioNames.includes(name)) return false;
    const component = exports[name];
    return !Object.entries(exports).some(
      ([alias, value]) => value === component && scenarioNames.includes(alias),
    );
  });
}

describe("component performance scenarios", () => {
  it("cover every public Vue component export", () => {
    const scenarioNames = componentPerformanceScenarios.map((scenario) => scenario.name);
    const uniqueScenarioNames = [...new Set(scenarioNames)].sort();
    const missingComponents = [
      ...missingScenarios(publicUiExports, uniqueScenarioNames),
      ...missingScenarios(publicNanaExports, uniqueScenarioNames),
      ...missingScenarios(publicNanaFeedbackExports, uniqueScenarioNames),
      ...missingScenarios(publicNanaShellExports, uniqueScenarioNames),
    ];
    expect(uniqueScenarioNames).toHaveLength(scenarioNames.length);
    expect(missingComponents).toEqual([]);
  });

  it("stays within the committed light benchmark baseline", async () => {
    const actual = await runComponentPerformanceSuite({ runner: "vitest-jsdom" });
    if (process.env.LILIA_UPDATE_PERF_BASELINE === "1") {
      writeComponentPerfBaseline(actual);
      expect(Object.keys(actual.scenarios).length).toBeGreaterThan(0);
      return;
    }

    const baseline = readComponentPerfBaseline();
    expect(validateComponentPerfBaseline(actual, baseline)).toEqual([]);
    const regressions = compareComponentPerfReport(actual, baseline);
    expect(regressions).toEqual([]);
  }, 60_000);
});
