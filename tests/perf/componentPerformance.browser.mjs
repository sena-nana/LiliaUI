import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import vue from "@vitejs/plugin-vue";

const baselinePath = resolve("tests/perf/componentPerformance.browser.baseline.json");
const reportPath = resolve("tests/perf/reports/component-performance-browser.json");

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function failReport(title, lines) {
  if (!lines.length) return false;
  console.error(title);
  for (const line of lines) console.error(`- ${line}`);
  process.exitCode = 1;
  return true;
}

const server = await createServer({
  configFile: false,
  plugins: [vue()],
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
let browser;
try {
  const {
    compareComponentPerfReport,
    validateComponentPerfBaseline,
  } = await server.ssrLoadModule("/tests/perf/componentPerformanceRunner.ts");

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://127.0.0.1:${address.port}/tests/perf/browserHarness.html`);
  const report = await page.evaluate(() => window.__liliaComponentPerfRun());
  writeJson(reportPath, report);
  console.log(`Wrote ${reportPath}`);
  if (process.env.LILIA_UPDATE_PERF_BASELINE === "1") {
    writeJson(baselinePath, report);
    console.log(`Updated ${baselinePath}`);
  } else {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    const mismatches = validateComponentPerfBaseline(report, baseline);
    if (!failReport("Browser component performance baseline mismatch:", mismatches)) {
      const regressions = compareComponentPerfReport(report, baseline);
      failReport(
        "Browser component performance regressions:",
        regressions.map((regression) =>
          `${regression.scenario} ${regression.metric}: actual ${regression.actual}, baseline ${regression.baseline}, allowed ${regression.allowed}`,
        ),
      );
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
