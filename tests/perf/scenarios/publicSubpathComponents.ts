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
import {
  AdvancedSettingsDisclosure,
  CompletionFeedback,
  DeviceStatusCard,
  ExpressiveFeatureCard,
  GuidedEmptyState,
  ProgressiveSection,
  SetupStep,
  SetupStepper,
} from "@lilia/nana-ui/consumer";
import {
  ContextPanel,
  NanaEditorLayout,
  NanaHomeLayout,
  NanaOnboardingLayout,
  NanaSettingsLayout,
  PersistentStatusBar,
  PrimaryActionArea,
  TaskPageHeader,
} from "@lilia/nana-ui/patterns";
import {
  NanaAboutSection,
  NanaAppearanceSection,
} from "@lilia/nana-ui/settings";
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
  {
    name: "AdvancedSettingsDisclosure",
    render: (step) => h(AdvancedSettingsDisclosure, {
      title: `Advanced ${step.value}`,
      agentId: "perf.nana.advanced",
    }, () => "Advanced content"),
    interact: (root) => click(root, "[data-agent-id='perf.nana.advanced'] button"),
  },
  {
    name: "CompletionFeedback",
    render: (step) => h(CompletionFeedback, {
      trigger: step.value,
      label: "Saved",
      agentId: "perf.nana.completion",
    }),
  },
  {
    name: "DeviceStatusCard",
    render: (step) => h(DeviceStatusCard, {
      title: "Camera",
      state: step.value % 2 === 0 ? "connected" : "reconnecting",
      description: `Device revision ${step.value}`,
      agentId: "perf.nana.device",
    }),
  },
  {
    name: "ExpressiveFeatureCard",
    render: (step) => h(ExpressiveFeatureCard, {
      title: `Feature ${step.value}`,
      description: "Consumer feature",
      agentId: "perf.nana.feature",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.feature']"),
  },
  {
    name: "GuidedEmptyState",
    render: (step) => h(GuidedEmptyState, {
      title: "No devices",
      description: `Scan ${step.value + 1}`,
      nextStep: "Connect a device",
      agentId: "perf.nana.guided-empty",
    }),
  },
  {
    name: "ProgressiveSection",
    render: (step) => h(ProgressiveSection, {
      level: step.value % 2 === 0 ? "essential" : "optional",
      title: `Section ${step.value}`,
      agentId: "perf.nana.progressive",
    }, () => "Progressive content"),
  },
  {
    name: "SetupStep",
    render: (step) => h(SetupStep, {
      title: "Connect",
      state: step.value % 2 === 0 ? "current" : "complete",
      step: 1,
      agentId: "perf.nana.setup-step",
    }),
  },
  {
    name: "SetupStepper",
    render: (step) => h(SetupStepper, {
      label: `Setup ${step.value}`,
      agentId: "perf.nana.stepper",
    }, () => h(SetupStep, { title: "Connect", state: "current", step: 1 })),
  },
  {
    name: "ContextPanel",
    render: (step) => h(ContextPanel, { title: `Context ${step.value}`, agentId: "perf.nana.context" }, () => "Details"),
  },
  {
    name: "NanaEditorLayout",
    render: (step) => h(NanaEditorLayout, {
      contextVisible: step.value % 2 === 0,
      statusVisible: true,
      agentId: "perf.nana.editor",
    }, {
      top: () => "Toolbar",
      objects: () => "Objects",
      preview: () => "Preview",
      context: () => "Context",
      status: () => "Ready",
    }),
  },
  {
    name: "NanaHomeLayout",
    render: (step) => h(NanaHomeLayout, { title: `Home ${step.value}`, agentId: "perf.nana.home" }, {
      recent: () => "Recent",
      device: () => "Device",
      "next-step": () => "Next",
      history: () => "History",
    }),
  },
  {
    name: "NanaOnboardingLayout",
    render: (step) => h(NanaOnboardingLayout, {
      title: "Setup",
      currentStep: step.value + 1,
      totalSteps: 3,
      agentId: "perf.nana.onboarding",
    }, () => "Step content"),
    interact: (root) => click(root, "[data-agent-id='perf.nana.onboarding'] footer button:last-child"),
  },
  {
    name: "NanaSettingsLayout",
    render: (step) => h(NanaSettingsLayout, { title: `Settings ${step.value}`, agentId: "perf.nana.settings-layout" }, () => "Settings content"),
  },
  {
    name: "PersistentStatusBar",
    render: (step) => h(PersistentStatusBar, { label: `Status ${step.value}`, agentId: "perf.nana.status-bar" }, () => "Ready"),
  },
  {
    name: "PrimaryActionArea",
    render: (step) => h(PrimaryActionArea, { agentId: "perf.nana.primary-actions" }, {
      default: () => h("button", `Continue ${step.value}`),
      secondary: () => h("button", "Cancel"),
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.primary-actions'] button"),
  },
  {
    name: "TaskPageHeader",
    render: (step) => h(TaskPageHeader, { title: `Task ${step.value}`, description: "Description", agentId: "perf.nana.task-header" }),
  },
  {
    name: "NanaAppearanceSection",
    render: () => h(NanaAppearanceSection),
    interact: (root) => click(root, "[data-agent-id='settings.appearance.theme'] button"),
  },
  {
    name: "NanaAboutSection",
    render: (step) => h("section", [h(NanaAboutSection), h("span", `Revision ${step.value}`)]),
  },
];
