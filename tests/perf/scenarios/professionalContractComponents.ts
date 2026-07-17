import {
  UiCheckbox,
  UiDialog,
  UiDrawer,
  UiFormField,
  UiInteractiveCard,
  UiListItem,
  UiPopover,
  UiProgress,
  UiSkeleton,
  UiStatusBadge,
  UiTabs,
  UiToast,
  UiValidationMessage,
} from "@lilia/ui";
import { h, ref } from "vue";
import type { ComponentPerfScenario } from "../componentScenarios";

function click(root: ParentNode, selector: string) {
  const element = (root.ownerDocument ?? document).querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing perf click target: ${selector}`);
  element.click();
}

const surfaceLongListSelectionOffset = ref(0);

export const professionalContractComponentScenarios: ComponentPerfScenario[] = [
  {
    name: "UiCheckbox",
    render: (step) => h(UiCheckbox, {
      modelValue: step.value % 2 === 1,
      label: "Include archived",
      agentId: "perf.checkbox",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.checkbox']"),
  },
  {
    name: "UiFormField",
    render: (step) => h(UiFormField, {
      label: "Name",
      hint: "Visible to collaborators",
      error: step.value % 2 === 1 ? "Name is required" : undefined,
    }, {
      default: ({ controlId, describedBy }: { controlId: string; describedBy?: string }) =>
        h("input", { id: controlId, "aria-describedby": describedBy, value: `item-${step.value}` }),
    }),
    interact: (root) => click(root, ".ui-form-field input"),
  },
  {
    name: "UiValidationMessage",
    render: (step) => h(UiValidationMessage, {
      message: step.value % 2 === 0 ? "Value is required" : "Check this value",
      intent: step.value % 2 === 0 ? "danger" : "warning",
    }),
  },
  {
    name: "UiDialog",
    render: (step) => h(UiDialog, {
      open: true,
      title: "Edit item",
      description: `Revision ${step.value + 1}`,
      agentId: "perf.dialog",
    }, { default: () => h("button", { type: "button" }, "Save") }),
    interact: (root) => click(root, "[data-agent-id='perf.dialog'] .ui-overlay__close"),
  },
  {
    name: "UiDrawer",
    render: (step) => h(UiDrawer, {
      open: true,
      title: "Inspector",
      side: step.value % 2 === 0 ? "right" : "left",
      agentId: "perf.drawer",
    }, { default: () => h("button", { type: "button" }, "Apply") }),
    interact: (root) => click(root, "[data-agent-id='perf.drawer'] .ui-overlay__close"),
  },
  {
    name: "UiPopover",
    render: (step) => h(UiPopover, {
      open: true,
      placement: step.value % 2 === 0 ? "bottom" : "right",
      agentId: "perf.popover",
    }, {
      trigger: () => h("button", { type: "button" }, "More"),
      default: () => h("button", { type: "button" }, "Rename"),
    }),
    interact: (root) => click(root, ".ui-popover__trigger button"),
  },
  {
    name: "UiTabs",
    render: (step) => h(UiTabs, {
      modelValue: step.value % 2 === 0 ? "summary" : "details",
      options: [{ value: "summary", label: "Summary" }, { value: "details", label: "Details" }],
      agentId: "perf.tabs",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.tabs.details']"),
  },
  {
    name: "UiToast",
    render: (step) => h(UiToast, {
      title: "Saved",
      description: `Revision ${step.value + 1} is ready`,
      tone: step.value % 2 === 0 ? "success" : "info",
      agentId: "perf.toast",
    }),
    interact: (root) => click(root, ".ui-toast__dismiss"),
  },
  {
    name: "UiProgress",
    render: (step) => h(UiProgress, {
      value: 30 + step.value * 10,
      max: 100,
      label: "Uploading",
      cancellable: true,
      agentId: "perf.progress",
    }),
    interact: (root) => click(root, ".ui-progress__cancel"),
  },
  {
    name: "UiSkeleton",
    render: (step) => h(UiSkeleton, { width: `${120 + step.value}px`, height: "16px", label: "Loading" }),
  },
  {
    name: "UiStatusBadge",
    render: (step) => h(UiStatusBadge, {
      label: step.value % 2 === 0 ? "Connected" : "Reconnecting",
      tone: step.value % 2 === 0 ? "success" : "warning",
    }),
  },
  {
    name: "UiInteractiveCard",
    render: (step) => h(UiInteractiveCard, {
      selected: step.value % 2 === 1,
      agentId: "perf.interactive-card",
    }, () => "Workspace"),
    interact: (root) => click(root, "[data-agent-id='perf.interactive-card']"),
  },
  {
    name: "UiListItem",
    render: (step) => h(UiListItem, {
      selected: step.value % 2 === 1,
      agentId: "perf.list-item",
    }, () => "Recent item"),
    interact: (root) => click(root, "[data-agent-id='perf.list-item']"),
  },
  {
    name: "SurfaceStateLayerLongList",
    runners: ["browser"],
    prepare: () => { surfaceLongListSelectionOffset.value = 0; },
    render: (step) => h("section", {
      "data-lilia-surface-mode": step.value % 2 === 0 ? "solid" : "translucent",
      "data-lilia-backdrop": "none",
      "data-lilia-surface-boundary": "",
      "data-agent-id": "perf.surface-long-list",
      style: { maxHeight: "320px", overflow: "auto" },
    }, Array.from({ length: 240 }, (_, index) => h(UiListItem, {
      selected: index === (surfaceLongListSelectionOffset.value + step.value * 239) % 240,
      agentId: `perf.surface-row.${index}`,
      onSelect: () => {
        surfaceLongListSelectionOffset.value = (index - step.value * 239 + 240) % 240;
      },
    }, () => `Row ${index}`))),
    interact: (root) => {
      const viewport = (root.ownerDocument ?? document).querySelector("[data-agent-id='perf.surface-long-list']");
      if (!(viewport instanceof HTMLElement)) throw new Error("Missing surface long-list viewport");
      viewport.scrollTop = viewport.scrollHeight;
      viewport.dispatchEvent(new Event("scroll", { bubbles: true }));
      click(root, "[data-agent-id='perf.surface-row.120']");
    },
  },
];
