import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const rootVueRouter = fileURLToPath(
  new URL("./node_modules/vue-router/dist/vue-router.js", import.meta.url),
);
const rootVue = fileURLToPath(
  new URL("./node_modules/vue/dist/vue.runtime.esm-bundler.js", import.meta.url),
);

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^vue$/,
        replacement: rootVue,
      },
      {
        find: /^vue-router$/,
        replacement: rootVueRouter,
      },
    ],
    dedupe: ["vue", "vue-router"],
  },
  test: {
    environment: "jsdom",
    execArgv: ["--no-experimental-webstorage"],
    include: ["tests/ui/**/*.test.ts", "tests/*.test.mjs"],
    maxWorkers: 2,
    setupFiles: ["./tests/setupTests.ts"],
    server: {
      deps: {
        inline: [
          "@lilia/ui",
          "@lilia/ui-contract",
          "@lilia/ui-foundation",
        ],
      },
    },
  },
});
