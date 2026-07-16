import Search from "@lucide/vue/dist/esm/icons/search.mjs";
import {
  NanaButton,
  NanaCheckbox,
  NanaIconButton,
  NanaInput,
  NanaSegmentedControl,
  NanaSelect,
  NanaSlider,
  NanaSwitch,
  NanaTabs,
  NanaTextarea,
} from "@lilia/nana-ui";
import { h } from "vue";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { change, click, input, keydown } from "./helpers";

export const nanaControlScenarios: ComponentPerfScenario[] = [
  {
    name: "NanaButton",
    render: (step) => h(NanaButton, {
      variant: step.value % 2 === 0 ? "secondary" : "primary",
      agentId: "perf.nana.button",
    }, () => "Continue"),
    interact: (root) => click(root, "[data-agent-id='perf.nana.button']"),
  },
  {
    name: "NanaIconButton",
    render: (step) => h(NanaIconButton, {
      icon: Search,
      label: "Search",
      active: step.value % 2 === 1,
      agentId: "perf.nana.icon-button",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.icon-button']"),
  },
  {
    name: "NanaInput",
    render: (step) => h(NanaInput, {
      modelValue: `value-${step.value}`,
      ariaLabel: "Name",
      agentId: "perf.nana.input",
    }),
    interact: (root) => input(root, "[data-agent-id='perf.nana.input']", "updated"),
  },
  {
    name: "NanaTextarea",
    render: (step) => h(NanaTextarea, {
      modelValue: `Notes ${step.value}`,
      ariaLabel: "Notes",
      agentId: "perf.nana.textarea",
    }),
    interact: (root) => input(root, "[data-agent-id='perf.nana.textarea']", "updated notes"),
  },
  {
    name: "NanaSelect",
    render: (step) => h(NanaSelect, {
      modelValue: step.value % 2 === 0 ? "simple" : "advanced",
      options: [{ value: "simple", label: "Simple" }, { value: "advanced", label: "Advanced" }],
      ariaLabel: "Mode",
      agentId: "perf.nana.select",
    }),
    interact: (root) => change(root, "[data-agent-id='perf.nana.select']", "advanced"),
  },
  {
    name: "NanaCheckbox",
    render: (step) => h(NanaCheckbox, {
      modelValue: step.value % 2 === 1,
      label: "Include archived",
      agentId: "perf.nana.checkbox",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.checkbox'] input"),
  },
  {
    name: "NanaSwitch",
    render: (step) => h(NanaSwitch, {
      modelValue: step.value % 2 === 1,
      label: "Automatic",
      agentId: "perf.nana.switch",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.switch']"),
  },
  {
    name: "NanaSlider",
    render: (step) => h(NanaSlider, {
      modelValue: 40 + step.value,
      ariaLabel: "Volume",
      agentId: "perf.nana.slider",
    }),
    interact: (root) => input(root, "[data-agent-id='perf.nana.slider']", "65"),
  },
  {
    name: "NanaTabs",
    render: (step) => h(NanaTabs, {
      modelValue: step.value % 2 === 0 ? "summary" : "details",
      options: [{ value: "summary", label: "Summary" }, { value: "details", label: "Details" }],
      agentId: "perf.nana.tabs",
    }),
    interact: (root) => keydown(root, "[data-agent-id='perf.nana.tabs'] [role='tab']", "ArrowRight"),
  },
  {
    name: "NanaSegmentedControl",
    render: (step) => h(NanaSegmentedControl, {
      modelValue: step.value % 2 === 0 ? "easy" : "custom",
      options: [{ value: "easy", label: "Easy" }, { value: "custom", label: "Custom" }],
      agentId: "perf.nana.segmented",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.segmented'] [role='tab']:last-child"),
  },
];
