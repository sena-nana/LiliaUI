import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "#ui-layer": resolve("../../packages/ui/src/index.ts"),
      "#ui-styles": resolve("../../packages/ui/src/styles.css"),
    },
  },
  build: {
    outDir: "dist/lilia",
    emptyOutDir: true,
  },
});
