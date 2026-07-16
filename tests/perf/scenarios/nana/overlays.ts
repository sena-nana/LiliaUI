import {
  NanaDialog,
  NanaDrawer,
  NanaPopover,
  NanaTooltip,
} from "@lilia/nana-ui";
import { defineComponent, h, ref } from "vue";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { click, focusIn, pointerDownOutside } from "./helpers";

const dialogHost = defineComponent({
  name: "NanaDialogPerfHost",
  props: { revision: { type: Number, required: true } },
  setup(props) {
    const open = ref(true);
    return () => h(NanaDialog, {
      open: open.value,
      title: "Edit profile",
      description: `Revision ${props.revision}`,
      agentId: "perf.nana.dialog",
      onClose: () => { open.value = false; },
    }, { default: () => h("button", { type: "button" }, "Save") });
  },
});

const drawerHost = defineComponent({
  name: "NanaDrawerPerfHost",
  props: { side: { type: String as () => "left" | "right", required: true } },
  setup(props) {
    const open = ref(true);
    return () => h(NanaDrawer, {
      open: open.value,
      title: "Properties",
      side: props.side,
      agentId: "perf.nana.drawer",
      onClose: () => { open.value = false; },
    }, { default: () => h("button", { type: "button" }, "Apply") });
  },
});

const popoverHost = defineComponent({
  name: "NanaPopoverPerfHost",
  props: { placement: { type: String as () => "bottom" | "right", required: true } },
  setup(props) {
    const open = ref(true);
    return () => h(NanaPopover, {
      open: open.value,
      placement: props.placement,
      agentId: "perf.nana.popover",
      onClose: () => { open.value = false; },
    }, {
      trigger: () => h("button", { type: "button" }, "More"),
      default: () => h("button", { type: "button" }, "Rename"),
    });
  },
});

export const nanaOverlayScenarios: ComponentPerfScenario[] = [
  {
    name: "NanaDialog",
    runners: ["browser"],
    render: (step) => h(dialogHost, { revision: step.value + 1 }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.dialog'] .nana-icon-button"),
  },
  {
    name: "NanaDrawer",
    runners: ["browser"],
    render: (step) => h(drawerHost, { side: step.value % 2 === 0 ? "right" : "left" }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.drawer'] .nana-icon-button"),
  },
  {
    name: "NanaPopover",
    runners: ["browser"],
    render: (step) => h(popoverHost, { placement: step.value % 2 === 0 ? "bottom" : "right" }),
    interact: (root) => pointerDownOutside(root),
  },
  {
    name: "NanaTooltip",
    runners: ["browser"],
    render: (step) => h(NanaTooltip, {
      text: `Hint ${step.value + 1}`,
      delayMs: 0,
      agentId: "perf.nana.tooltip",
    }, () => h("button", { type: "button", "data-agent-id": "perf.nana.tooltip-trigger" }, "Inspect")),
    interact: (root) => focusIn(root, "[data-agent-id='perf.nana.tooltip-trigger']"),
  },
];
