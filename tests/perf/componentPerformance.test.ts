import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type ComponentPerfReport,
  compareComponentPerfReport,
  runComponentPerformanceSuite,
} from "./componentPerformanceRunner";
import { componentPerformanceScenarios } from "./componentScenarios";

const componentPerfBaselinePath = resolve("tests/perf/componentPerformance.baseline.json");

function readComponentPerfBaseline() {
  return JSON.parse(readFileSync(componentPerfBaselinePath, "utf8")) as ComponentPerfReport;
}

function writeComponentPerfBaseline(report: ComponentPerfReport) {
  mkdirSync(dirname(componentPerfBaselinePath), { recursive: true });
  writeFileSync(componentPerfBaselinePath, `${JSON.stringify(report, null, 2)}\n`);
}

function exportedVueComponentNames() {
  const source = readFileSync(resolve("packages/ui/src/index.ts"), "utf8");
  const names = Array.from(
    source.matchAll(/export \{ default as (\w+) \} from "\.\/(?:AppRoot\.vue|components\/[^"]+|layouts\/[^"]+)";/g),
    (match) => match[1],
  );
  if (source.includes("export const LiliaSettingsPage")) {
    names.push("LiliaSettingsPage");
  }
  return names.sort();
}

describe("component performance scenarios", () => {
  it("cover every public Vue component export", () => {
    const scenarioNames = componentPerformanceScenarios.map((scenario) => scenario.name).sort();
    expect(scenarioNames).toEqual(exportedVueComponentNames());
  });

  it("stays within the committed light benchmark baseline", async () => {
    const actual = await runComponentPerformanceSuite({ runner: "vitest-jsdom" });
    if (process.env.LILIA_UPDATE_PERF_BASELINE === "1") {
      writeComponentPerfBaseline(actual);
      expect(Object.keys(actual.scenarios).length).toBeGreaterThan(0);
      return;
    }

    const baseline = readComponentPerfBaseline();
    const regressions = compareComponentPerfReport(actual, baseline);
    expect(regressions).toEqual([]);
  }, 60_000);
});
