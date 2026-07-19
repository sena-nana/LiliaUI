import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import { NanaAppShell, NanaSidebar, NanaTitleBar } from "@lilia/nana-ui/shell";
import { h } from "vue";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { click, keydown } from "./helpers";

const navigation = [
  { id: "home", label: "Home", icon: Home, active: true, agentId: "perf.nana.nav.home" },
  { id: "library", label: "Library", icon: Home, agentId: "perf.nana.nav.library" },
  { id: "advanced", label: "Advanced", icon: Settings, depth: 1, agentId: "perf.nana.nav.advanced" },
] as const;
const settingsItem = { id: "settings", label: "Settings", icon: Settings };
const stressNavigation = Array.from({ length: 200 }, (_, index) => ({
  id: `item-${index}`,
  label: `Item ${index}`,
  agentId: `perf.nana.stress.item.${index}`,
}));

export const nanaShellScenarios: ComponentPerfScenario[] = [
  {
    name: "NanaTitleBar",
    runners: ["browser"],
    render: (step) => h(NanaTitleBar, { title: `Nana ${step.value}` }),
    interact: (root) => click(root, "[data-agent-id='nana.window.maximize']"),
  },
  {
    name: "NanaSidebar",
    runners: ["browser"],
    render: (step) => h(NanaSidebar, {
      items: navigation.map((item) => ({ ...item, active: item.id === (step.value % 2 === 0 ? "home" : "library") })),
      settingsItem,
      mode: "expanded",
      agentId: "perf.nana.sidebar",
    }),
    interact: (root) => {
      keydown(root, "[data-agent-id='perf.nana.nav.home']", "ArrowDown");
      click(root, "[data-agent-id='nana.shell.sidebar.toggle']");
    },
  },
  {
    name: "NanaSidebarStress200",
    runners: ["browser"],
    budgets: { interaction: 8.3, update: 8.3 },
    render: (step) => h(NanaSidebar, {
      items: stressNavigation.map((item, index) => ({
        ...item,
        active: index === step.value % stressNavigation.length,
      })),
      mode: "expanded",
      collapsible: false,
      agentId: "perf.nana.sidebar-stress",
    }),
    interact: (root) => keydown(root, "[data-agent-id='perf.nana.stress.item.0']", "ArrowDown"),
  },
  {
    name: "NanaAppShell",
    runners: ["browser"],
    render: (step) => h(NanaAppShell, {
      title: `Nana Project ${step.value + 1}`,
      agentId: "perf.nana.shell",
    }, {
      "header-actions": () => h("button", { "data-agent-id": "perf.nana.shell.action" }, "Save"),
      default: () => h("section", "Workspace"),
      overlays: () => h("div", "Application overlay"),
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.shell.action']"),
  },
];
