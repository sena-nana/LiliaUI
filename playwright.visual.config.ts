import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:4178",
    browserName: "chromium",
    viewport: { width: 880, height: 780 },
  },
  webServer: {
    command: "yarn vite --config tests/visual/vite.config.ts",
    url: "http://127.0.0.1:4178/tests/visual/harness.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
