declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "@lucide/vue/dist/esm/icons/*.mjs" {
  import type { Component } from "vue";

  const component: Component;
  export default component;
}
