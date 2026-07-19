import { defineConfig } from "@playwright/test";
import { resolveChromiumExecutable } from "./tests/browser/chromium.ts";

const executablePath = resolveChromiumExecutable();

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:4178",
    browserName: "chromium",
    launchOptions: executablePath ? { executablePath } : undefined,
    viewport: { width: 880, height: 780 },
  },
  webServer: {
    command: "yarn vite --config tests/visual/vite.config.ts",
    url: "http://127.0.0.1:4178/tests/visual/harness.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
