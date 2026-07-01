import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import vue from "@vitejs/plugin-vue";

const reportPath = resolve("tests/perf/reports/component-performance-browser.json");
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

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://127.0.0.1:${address.port}/tests/perf/browserHarness.html`);
  const report = await page.evaluate(() => window.__liliaComponentPerfRun());
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${reportPath}`);
} finally {
  await browser.close();
  await server.close();
}
