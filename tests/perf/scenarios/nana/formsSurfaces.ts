import {
  NanaCard,
  NanaEmptyState,
  NanaFormField,
  NanaInteractiveCard,
  NanaListItem,
  NanaSkeleton,
  NanaStatusBadge,
  NanaUIProvider,
  NanaValidationMessage,
} from "@lilia/nana-ui";
import { h } from "vue";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { click } from "./helpers";

export const nanaFormSurfaceScenarios: ComponentPerfScenario[] = [
  {
    name: "NanaFormField",
    render: (step) => h(NanaFormField, {
      label: "Display name",
      hint: "Visible to others",
      error: step.value % 2 === 1 ? "Name is required" : undefined,
      agentId: "perf.nana.field",
    }, {
      default: ({ controlId, describedBy }: { controlId: string; describedBy?: string }) =>
        h("input", { id: controlId, "aria-describedby": describedBy, value: `Name ${step.value}` }),
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.field'] input"),
  },
  {
    name: "NanaValidationMessage",
    render: (step) => h(NanaValidationMessage, {
      message: step.value % 2 === 0 ? "Required" : "Check this value",
      intent: step.value % 2 === 0 ? "danger" : "warning",
    }),
  },
  {
    name: "NanaCard",
    render: (step) => h(NanaCard, {
      variant: step.value % 2 === 0 ? "default" : "outlined",
      selected: step.value % 2 === 1,
    }, () => h("p", "Account summary")),
  },
  {
    name: "NanaInteractiveCard",
    render: (step) => h(NanaInteractiveCard, {
      selected: step.value % 2 === 1,
      pressed: step.value % 2 === 1,
      agentId: "perf.nana.interactive-card",
    }, () => "Choose profile"),
    interact: (root) => click(root, "[data-agent-id='perf.nana.interactive-card'] button"),
  },
  {
    name: "NanaListItem",
    render: (step) => h(NanaListItem, {
      selected: step.value % 2 === 1,
      agentId: "perf.nana.list-item",
    }, () => "Recent project"),
    interact: (root) => click(root, "[data-agent-id='perf.nana.list-item']"),
  },
  {
    name: "NanaSkeleton",
    render: (step) => h(NanaSkeleton, {
      width: `${140 + step.value}px`,
      height: "18px",
      label: "Loading preview",
    }),
  },
  {
    name: "NanaStatusBadge",
    render: (step) => h(NanaStatusBadge, {
      label: step.value % 2 === 0 ? "Connected" : "Reconnecting",
      tone: step.value % 2 === 0 ? "success" : "warning",
    }),
  },
  {
    name: "NanaEmptyState",
    render: (step) => h(NanaEmptyState, {
      title: "No projects",
      description: `Try filter ${step.value + 1}`,
    }, { actions: () => h("button", { type: "button" }, "Create project") }),
    interact: (root) => click(root, ".nana-empty__actions button"),
  },
  {
    name: "NanaUIProvider",
    render: (step) => h(NanaUIProvider, {
      theme: step.value % 2 === 0 ? "light" : "dark",
      policy: { density: step.value % 2 === 0 ? "comfortable" : "compact" },
      agentId: "perf.nana.provider",
    }, () => h("div", "Consumer content")),
  },
];
