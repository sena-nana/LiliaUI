import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    execArgv: ["--no-experimental-webstorage"],
    include: ["tests/perf/componentPerformance.test.ts"],
    setupFiles: ["./tests/setupTests.ts"],
  },
});
