import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import { NanaSettingsPage } from "@lilia/nana-ui/settings";
import { createSettingsModel, settingsKey } from "@lilia/ui-foundation/settings";
import { defineComponent, h, type App, type Plugin } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { click } from "./helpers";

const Section = defineComponent({
  props: { label: String },
  setup(props) {
    return () => h("section", props.label);
  },
});
const settings = createSettingsModel({
  defaultTab: "general",
  fullPageTabs: ["advanced"],
  path: "/settings",
  sections: { general: Section, advanced: Section },
  tabs: [
    { key: "general", label: "General", icon: Settings, props: { label: "General settings" } },
    { key: "advanced", label: "Advanced", icon: Settings, props: { label: "Advanced settings" } },
  ],
});

let router: ReturnType<typeof createRouter> | null = null;
const settingsPlugin: Plugin = {
  install(app: App) {
    app.provide(settingsKey, settings);
  },
};

function createRouterPlugin() {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/settings", component: NanaSettingsPage },
      { path: "/:pathMatch(.*)*", redirect: "/settings" },
    ],
  });
  void router.push("/settings");
  return router;
}

export const nanaSettingsScenarios: ComponentPerfScenario[] = [{
  name: "NanaSettingsPage",
  runners: ["browser"],
  createPlugins: () => [createRouterPlugin(), settingsPlugin],
  beforeMount: async () => router?.isReady(),
  render: () => h("div", [
    h("button", {
      "data-agent-id": "perf.nana.settings.toggle",
      onClick: () => router?.push("/settings?tab=advanced"),
    }, "Open advanced"),
    h(NanaSettingsPage),
  ]),
  interact: (root) => click(root, "[data-agent-id='perf.nana.settings.toggle']"),
}];
