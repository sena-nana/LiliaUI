import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^vue-router$/,
        replacement: resolve("node_modules/vue-router/dist/vue-router.js"),
      },
    ],
    dedupe: ["vue", "vue-router"],
  },
  test: {
    environment: "jsdom",
    execArgv: ["--no-experimental-webstorage"],
    include: ["tests/perf/componentPerformance.test.ts"],
    setupFiles: ["./tests/setupTests.ts"],
  },
});
