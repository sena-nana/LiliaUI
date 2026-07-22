import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import {
  LiliaAboutSection,
  LiliaAppearanceSection,
  LiliaSettingsSidebar,
} from "@lilia/ui/settings";
import {
  LiliaSidebarFooter,
  LiliaSidebarFrame,
  LiliaSidebarNavRow,
} from "@lilia/ui/shell";
import { h, type Plugin } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import type { ComponentPerfScenario } from "../componentScenarios";

function createRouterPlugin(): Plugin {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { render: () => h("div", "Home") } },
      { path: "/settings", component: { render: () => h("div", "Settings") } },
    ],
  });
  void router.push("/");
  return router;
}

function click(root: ParentNode, selector: string) {
  const target = (root.ownerDocument ?? document).querySelector(selector);
  if (!(target instanceof HTMLElement)) throw new Error(`Missing perf interaction target: ${selector}`);
  target.click();
}

export const publicSubpathComponentScenarios: ComponentPerfScenario[] = [
  {
    name: "LiliaSettingsSidebar",
    createPlugins: () => [createRouterPlugin()],
    render: (step) => h(LiliaSettingsSidebar, {
      activeKey: step.value % 2 === 0 ? "appearance" : "about",
      returnTo: "/",
      tabs: [
        { key: "appearance", label: "Appearance", icon: Settings, to: "/settings?tab=appearance" },
        { key: "about", label: "About", icon: Home, to: "/settings?tab=about" },
      ],
    }),
    interact: (root) => click(root, "[data-agent-id='settings.tab.about']"),
  },
  {
    name: "LiliaAppearanceSection",
    render: () => h(LiliaAppearanceSection),
    interact: (root) => click(root, "[data-agent-id='settings.appearance.theme.light']"),
  },
  {
    name: "LiliaAboutSection",
    render: (step) => h("section", [h(LiliaAboutSection), h("span", `Revision ${step.value}`)]),
  },
  {
    name: "LiliaSidebarFrame",
    render: (step) => h(LiliaSidebarFrame, {
      agentId: "perf.lilia.sidebar-frame",
      defaultFooter: step.value % 2 === 0,
    }, { default: () => `Sidebar ${step.value}` }),
  },
  {
    name: "LiliaSidebarNavRow",
    render: (step) => h(LiliaSidebarNavRow, {
      agentId: "perf.lilia.sidebar-nav",
      item: {
        key: "home",
        label: `Home ${step.value}`,
        icon: Home,
        active: step.value % 2 === 1,
        onSelect: () => undefined,
      },
    }),
    interact: (root) => click(root, "[data-agent-id='perf.lilia.sidebar-nav']"),
  },
  {
    name: "LiliaSidebarFooter",
    createPlugins: () => [createRouterPlugin()],
    render: (step) => h(LiliaSidebarFooter, {
      links: [{ key: "settings", label: `Settings ${step.value}`, icon: Settings, to: "/settings" }],
      statuses: [{ key: "runtime", label: "Ready", title: "Runtime ready", icon: Home, to: "/", tone: "ok" }],
    }),
    interact: (root) => click(root, "[data-agent-id='sidebar.footer.settings']"),
  },
];
