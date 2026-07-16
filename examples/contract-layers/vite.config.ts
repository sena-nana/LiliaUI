import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const layer = process.env.UI_LAYER === "nana" ? "nana" : "lilia";
  const packageName = layer === "nana" ? "nana-ui" : "ui";

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "#ui-layer": resolve(`../../packages/${packageName}/src/index.ts`),
        "#ui-styles": resolve(`../../packages/${packageName}/src/styles.css`),
      },
    },
    build: {
      outDir: `dist/${layer}`,
      emptyOutDir: true,
    },
  };
});
