import Search from "@lucide/vue/dist/esm/icons/search.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import {
  ActionMenuItem,
  AnchoredActionMenu,
  ConfirmDialog,
  ContextMenuHost,
  Dropdown,
  LiliaAppRoot,
  LiliaDesktopShell,
  LiliaSettingsPage,
  PopupShell,
  PopupTitleBarFrame,
  SearchDropdown,
  SettingsCollapsibleCard,
  SettingsRow,
  TitleBar,
  UiButton,
  UiCard,
  UiEmptyState,
  UiIconButton,
  UiInput,
  UiRangeField,
  UiSegmentedControl,
  UiSpinner,
  UiSwitch,
  UiTextarea,
  installGlobalScrollbarVisibility,
  openContextMenuAt,
  setLiliaAppConfig,
  uninstallGlobalScrollbarVisibility,
} from "@lilia/ui";
import { defineComponent, h, nextTick, type Plugin, type Ref, type VNode } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { testAppConfig } from "../ui/fixtures/appConfig";
import type { ComponentPerfRunner } from "./componentPerformanceRunner";

export interface ComponentPerfScenario {
  name: string;
  render: (step: Ref<number>) => VNode;
  runners?: readonly ComponentPerfRunner[];
  createPlugins?: () => Plugin[];
  beforeMount?: () => Promise<void> | void;
  prepare?: () => void;
  interact?: (root: ParentNode) => Promise<void> | void;
  cleanup?: () => void;
}

const routePage = defineComponent({
  name: "PerfRoutePage",
  setup() {
    return () => h("section", { class: "page" }, [
      h("h1", "Performance route"),
      h("p", "Reusable component benchmark route."),
    ]);
  },
});

let activeRouter: ReturnType<typeof createRouter> | null = null;

function resetAppConfig() {
  setLiliaAppConfig({
    ...testAppConfig,
    settings: {
      defaultTab: "appearance",
      tabs: [
        { key: "appearance", label: "外观", icon: "palette" },
        { key: "about", label: "关于", icon: "info" },
      ],
    },
  });
}

function createScenarioRouter(initialPath = "/") {
  activeRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: routePage },
      { path: "/components", component: routePage },
      { path: "/settings", component: LiliaSettingsPage, meta: { sidebar: "settings" } },
    ],
  });
  void activeRouter.push(initialPath);
  return activeRouter;
}

async function readyScenarioRouter() {
  await activeRouter?.isReady();
}

function documentFor(root: ParentNode) {
  return root instanceof Document ? root : root.ownerDocument ?? document;
}

function click(root: ParentNode, selector: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing perf interaction target: ${selector}`);
  }
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 24, clientY: 24 }));
}

function pointer(root: ParentNode, selector: string, type: string, init: {
  button?: number;
  clientX: number;
  clientY: number;
  pointerId?: number;
  pointerType?: string;
}) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing perf pointer target: ${selector}`);
  }
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: init.button ?? 0 },
    clientX: { value: init.clientX },
    clientY: { value: init.clientY },
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: init.pointerType ?? "mouse" },
  });
  element.dispatchEvent(event);
}

function input(root: ParentNode, selector: string, value: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing perf input target: ${selector}`);
  }
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
}

function changeChecked(root: ParentNode, selector: string, checked: boolean) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing perf checkbox target: ${selector}`);
  }
  element.checked = checked;
  element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
}

function animationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export const componentPerformanceScenarios: ComponentPerfScenario[] = [
  {
    name: "ActionMenuItem",
    render: (step) => h(ActionMenuItem, { icon: Search, active: step.value % 2 === 1 }, () => "Open item"),
    interact: (root) => click(root, ".sb-menu__item"),
  },
  {
    name: "AnchoredActionMenu",
    render: (step) => h(AnchoredActionMenu, {
      open: true,
      position: { x: 20 + step.value, y: 24, anchorX: 20, anchorY: 24 },
      ariaLabel: "Actions",
    }, () => h(ActionMenuItem, { icon: Settings }, () => "Settings")),
    interact: (root) => click(root, ".sb-menu__item"),
  },
  {
    name: "ConfirmDialog",
    render: (step) => h(ConfirmDialog, {
      open: true,
      title: "确认操作",
      message: `确认执行第 ${step.value + 1} 次操作。`,
      danger: step.value % 2 === 1,
    }),
    interact: (root) => click(root, "[data-agent-id='confirm-dialog.confirm']"),
  },
  {
    name: "ContextMenuHost",
    prepare: () => {
      openContextMenuAt(24, 24, [
        { id: "open", label: "打开", icon: Search },
        { id: "danger", label: "删除", danger: true, confirmLabel: "确认删除" },
        { id: "more", label: "更多", children: [{ id: "copy", label: "复制" }] },
      ]);
    },
    render: () => h(ContextMenuHost),
    interact: (root) => click(root, "[data-agent-id='context-menu.item.danger']"),
  },
  {
    name: "Dropdown",
    render: (step) => h(Dropdown, {
      modelValue: step.value % 2 === 0 ? "compact" : "dense",
      options: [
        { value: "compact", label: "Compact", hint: "Default", agentId: "perf.dropdown.option.compact" },
        { value: "dense", label: "Dense", hint: "High signal", agentId: "perf.dropdown.option.dense" },
        { value: "disabled", label: "Disabled", disabled: true, agentId: "perf.dropdown.option.disabled" },
      ],
      icon: Settings,
      placeholder: "Mode",
      agentId: "perf.dropdown",
    }),
    interact: async (root) => {
      click(root, "[data-agent-id='perf.dropdown']");
      await nextTick();
      click(root, "[data-agent-id='perf.dropdown.option.dense']");
    },
  },
  {
    name: "GlobalScrollbarVisibility",
    runners: ["browser"],
    prepare: installGlobalScrollbarVisibility,
    render: (step) => h("div", {
      "data-agent-id": "perf.global-scrollbar.scroller",
      style: {
        height: "160px",
        overflow: "auto",
        width: "240px",
      },
    }, [
      h("div", {
        style: {
          height: `${680 + step.value}px`,
          width: "520px",
        },
      }, "Scrollable performance content"),
    ]),
    interact: async (root) => {
      const scroller = documentFor(root).querySelector("[data-agent-id='perf.global-scrollbar.scroller']");
      if (!(scroller instanceof HTMLElement)) {
        throw new Error("Missing perf interaction target: global scrollbar scroller");
      }
      const rect = scroller.getBoundingClientRect();
      scroller.dispatchEvent(new PointerEvent("pointerover", {
        bubbles: true,
        clientX: rect.right - 2,
        clientY: rect.top + 24,
        pointerId: 2,
        pointerType: "mouse",
      }));
      scroller.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true,
        clientX: rect.right - 2,
        clientY: rect.top + 36,
        pointerId: 2,
        pointerType: "mouse",
      }));
      await animationFrame();
      scroller.scrollTop = 80;
      scroller.dispatchEvent(new Event("scroll", { bubbles: true, cancelable: true }));
      scroller.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: rect.right - 2,
        clientY: rect.top + 48,
        deltaY: 36,
      }));
      await animationFrame();
    },
    cleanup: uninstallGlobalScrollbarVisibility,
  },
  {
    name: "LiliaAppRoot",
    prepare: resetAppConfig,
    createPlugins: () => [createScenarioRouter("/")],
    beforeMount: readyScenarioRouter,
    render: () => h(LiliaAppRoot),
  },
  {
    name: "LiliaDesktopShell",
    prepare: resetAppConfig,
    createPlugins: () => [createScenarioRouter("/")],
    beforeMount: readyScenarioRouter,
    render: () => h(LiliaDesktopShell),
    interact: (root) => click(root, "[data-agent-id='titlebar.left-sidebar.toggle']"),
  },
  {
    name: "LiliaSettingsPage",
    prepare: resetAppConfig,
    createPlugins: () => [createScenarioRouter("/settings?tab=appearance")],
    beforeMount: readyScenarioRouter,
    render: () => h(LiliaSettingsPage),
  },
  {
    name: "PopupShell",
    render: (step) => h(PopupShell, { status: step.value % 2 === 1 }, {
      titlebar: () => h("header", { "data-agent-id": "perf.popup-shell.titlebar" }, "Popup"),
      default: () => h("section", { "data-agent-id": "perf.popup-shell.content" }, `Popup content ${step.value}`),
    }),
  },
  {
    name: "PopupTitleBarFrame",
    render: (step) => h(PopupTitleBarFrame, { closeWindow: false }, () => `Path / ${step.value}`),
    interact: (root) => click(root, "[data-agent-id='popup.titlebar.new']"),
  },
  {
    name: "SearchDropdown",
    render: (step) => h(SearchDropdown, {
      modelValue: step.value % 2 === 0 ? "li" : "ui",
      open: true,
      placeholder: "Search components",
    }, {
      default: ({ query, highlightQuerySegments }: any) => h("div", [
        ["Lilia shell", "UI Button", "Search dropdown"].map((label) =>
          h("div", { class: "search-dropdown__option", role: "option" }, [
            h("span", highlightQuerySegments(label, query).map((part: any) =>
              h("span", { class: part.highlight ? "is-highlight" : undefined }, part.text),
            )),
          ]),
        ),
      ]),
    }),
    interact: (root) => input(root, ".search-dropdown__input", "shell"),
  },
  {
    name: "SettingsCollapsibleCard",
    render: (step) => h(SettingsCollapsibleCard, {
      expanded: step.value % 2 === 0,
      controlsId: "perf-card-details",
      toggleAgentId: "perf.card.toggle",
      expandLabel: "展开",
      collapseLabel: "收起",
    }, {
      summary: () => h("span", "性能设置"),
      default: () => h("p", "详细设置内容"),
    }),
    interact: (root) => click(root, "[data-agent-id='perf.card.toggle']"),
  },
  {
    name: "SettingsRow",
    render: (step) => h(SettingsRow, {
      label: "主题",
      hint: `当前批次 ${step.value}`,
      loose: step.value % 2 === 1,
    }, () => h(UiSwitch, { modelValue: step.value % 2 === 0, label: "启用" })),
  },
  {
    name: "TitleBar",
    render: (step) => h(TitleBar, { title: `Lilia ${step.value}`, leftSidebarCollapsed: step.value % 2 === 1 }),
    interact: (root) => {
      pointer(root, "[data-agent-id='titlebar']", "pointerdown", { clientX: 80, clientY: 18 });
      pointer(root, "[data-agent-id='titlebar']", "pointermove", { clientX: 88, clientY: 18 });
      pointer(root, "[data-agent-id='titlebar']", "pointerup", { clientX: 88, clientY: 18 });
      click(root, "[data-agent-id='titlebar.left-sidebar.toggle']");
    },
  },
  {
    name: "UiButton",
    render: (step) => h(UiButton, { icon: Search, variant: step.value % 2 === 0 ? "ghost" : "primary" }, () => "Search"),
    interact: (root) => click(root, ".ui-button"),
  },
  {
    name: "UiCard",
    render: (step) => h(UiCard, { title: "状态", loading: step.value % 2 === 1 }, () => h("p", "Card body")),
  },
  {
    name: "UiEmptyState",
    render: (step) => h(UiEmptyState, {
      icon: Search,
      title: step.value % 2 === 0 ? "暂无结果" : "没有匹配项",
      message: `尝试第 ${step.value + 1} 个关键词。`,
    }),
  },
  {
    name: "UiIconButton",
    render: (step) => h(UiIconButton, {
      icon: Settings,
      label: "设置",
      active: step.value % 2 === 1,
      busy: step.value % 3 === 1,
      agentId: "perf.icon-button",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.icon-button']"),
  },
  {
    name: "UiInput",
    render: (step) => h(UiInput, { modelValue: `value-${step.value}`, agentId: "perf.input" }),
    interact: (root) => input(root, "[data-agent-id='perf.input']", "updated"),
  },
  {
    name: "UiRangeField",
    render: (step) => h(UiRangeField, {
      modelValue: 8 + step.value,
      min: 0,
      max: 24,
      unit: "px",
      ariaLabel: "Radius",
      agentId: "perf.range",
    }),
    interact: (root) => input(root, "[data-agent-id='perf.range']", "16"),
  },
  {
    name: "UiSegmentedControl",
    render: (step) => h(UiSegmentedControl, {
      modelValue: step.value % 2 === 0 ? "dark" : "light",
      ariaLabel: "Theme",
      options: [
        { value: "dark", label: "Dark", icon: Settings, agentId: "perf.segment.dark" },
        { value: "light", label: "Light", icon: Search, agentId: "perf.segment.light" },
      ],
    }),
    interact: (root) => click(root, "[data-agent-id='perf.segment.light']"),
  },
  {
    name: "UiSpinner",
    render: (step) => h(UiSpinner, { size: 14 + (step.value % 3), label: "加载中" }),
  },
  {
    name: "UiSwitch",
    render: (step) => h(UiSwitch, {
      modelValue: step.value % 2 === 0,
      label: "启用性能模式",
      hint: "用于组件评估",
      agentId: "perf.switch",
    }),
    interact: (root) => changeChecked(root, "[data-agent-id='perf.switch']", true),
  },
  {
    name: "UiTextarea",
    render: (step) => h(UiTextarea, {
      modelValue: `Line ${step.value}\nSecond line`,
      agentId: "perf.textarea",
    }),
    interact: (root) => input(root, "[data-agent-id='perf.textarea']", "updated\ncontent"),
  },
];
