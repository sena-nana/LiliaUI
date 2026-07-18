import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const rootVueRouter = fileURLToPath(
  new URL("./node_modules/vue-router/dist/vue-router.mjs", import.meta.url),
);

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
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
    setupFiles: ["./tests/setupTests.ts"],
    server: {
      deps: {
        inline: [
          "@lilia/nana-ui",
          "@lilia/ui",
          "@lilia/ui-contract",
          "@lilia/ui-foundation",
        ],
      },
    },
  },
});
