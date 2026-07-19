import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { arch, cpus, platform } from "node:os";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import vue from "@vitejs/plugin-vue";
import { launchChromium } from "../browser/chromium.ts";
import type {
  ComponentPerfRegression,
  ComponentPerfReport,
} from "./componentPerformanceTypes.ts";

interface ComponentPerformanceModule {
  compareComponentPerfBudgets(
    actual: ComponentPerfReport,
  ): ComponentPerfRegression[];
  compareComponentPerfReport(
    actual: ComponentPerfReport,
    baseline: ComponentPerfReport,
  ): ComponentPerfRegression[];
  validateComponentPerfBaseline(
    actual: ComponentPerfReport,
    baseline: ComponentPerfReport,
  ): string[];
}

const baselinePath = resolve("tests/perf/componentPerformance.browser.baseline.json");
const reportPath = resolve("tests/perf/reports/component-performance-browser.json");

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function failReport(title: string, lines: readonly string[]) {
  if (!lines.length) return false;
  console.error(title);
  for (const line of lines) console.error(`- ${line}`);
  process.exitCode = 1;
  return true;
}

function middle(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function aggregateReports(reports: readonly ComponentPerfReport[]) {
  const aggregate = structuredClone(reports[0]!);
  aggregate.generatedAt = new Date().toISOString();
  aggregate.iterations = reports.reduce((total, report) => total + report.iterations, 0);
  for (const [scenarioName, summary] of Object.entries(aggregate.scenarios)) {
    for (const phase of ["domNodes", "interaction", "mount", "unmount", "update"] as const) {
      const values = reports.map((report) => report.scenarios[scenarioName]![phase]);
      summary[phase] = {
        median: middle(values.map((value) => value.median)),
        p95: Math.max(...values.map((value) => value.p95)),
      };
    }
  }
  return aggregate;
}

const server = await createServer({
  configFile: false,
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^vue$/,
        replacement: resolve("node_modules/vue/dist/vue.runtime.esm-bundler.js"),
      },
      {
        find: /^vue-router$/,
        replacement: resolve("node_modules/vue-router/dist/vue-router.js"),
      },
    ],
    dedupe: ["vue", "vue-router"],
  },
  root: process.cwd(),
  server: {
    host: "127.0.0.1",
    port: 0,
  },
});

await server.listen();
const address = server.httpServer?.address();
if (!address || typeof address === "string") {
  throw new Error("Unable to start Vite performance harness.");
}
let browser: Awaited<ReturnType<typeof launchChromium>> | undefined;
try {
  const {
    compareComponentPerfBudgets,
    compareComponentPerfReport,
    validateComponentPerfBaseline,
  } = await server.ssrLoadModule(
    "/tests/perf/componentPerformanceRunner.ts",
  ) as ComponentPerformanceModule;

  browser = await launchChromium();
  const requestedSamples = Number.parseInt(process.env.LILIA_PERF_BASELINE_SAMPLES ?? "1", 10);
  const sampleCount = process.env.LILIA_UPDATE_PERF_BASELINE === "1"
    ? Math.max(1, Number.isFinite(requestedSamples) ? requestedSamples : 1)
    : 1;
  const reports: ComponentPerfReport[] = [];
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(`http://127.0.0.1:${address.port}/tests/perf/browserHarness.html`);
      reports.push(await page.evaluate<ComponentPerfReport>(() => {
        const perfWindow = window as unknown as Window & {
          __liliaComponentPerfRun: () => Promise<ComponentPerfReport>;
        };
        return perfWindow.__liliaComponentPerfRun();
      }));
    } finally {
      await page.close();
    }
  }
  const report = aggregateReports(reports);
  report.environment = {
    arch: arch(),
    browser: browser.version(),
    cpu: cpus()[0]?.model ?? "unknown",
    node: process.version,
    platform: platform(),
    viewport: "1280x800",
  };
  writeJson(reportPath, report);
  console.log(`Wrote ${reportPath}`);
  if (process.env.LILIA_UPDATE_PERF_BASELINE === "1") {
    writeJson(baselinePath, report);
    console.log(`Updated ${baselinePath}`);
  } else {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as ComponentPerfReport;
    const mismatches = validateComponentPerfBaseline(report, baseline);
    if (!failReport("Browser component performance baseline mismatch:", mismatches)) {
      const regressions = compareComponentPerfReport(report, baseline);
      failReport(
        "Browser component performance regressions:",
        regressions.map((regression) =>
          `${regression.scenario} ${regression.metric}: actual ${regression.actual}, baseline ${regression.baseline}, allowed ${regression.allowed}`,
        ),
      );
      if (process.env.LILIA_PERF_REFERENCE === "1") {
        const budgetRegressions = compareComponentPerfBudgets(report);
        failReport(
          "Reference component performance budget regressions:",
          budgetRegressions.map((regression) =>
            `${regression.scenario} ${regression.metric}: actual ${regression.actual}, allowed ${regression.allowed}`,
          ),
        );
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
