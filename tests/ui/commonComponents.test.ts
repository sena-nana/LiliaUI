import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  SettingsRow,
  LiliaSidebarRow,
  LiliaSidebarSection,
  UiButton,
  UiCard,
  UiEmptyState,
  UiIconButton,
  UiInput,
  UiRangeField,
  UiSelect,
  UiSegmentedControl,
  UiSpinner,
  UiSwitch,
  UiTextarea,
  type UiSegmentedOption,
  type UiSelectOption,
} from "@lilia/ui";

const TestIcon = defineComponent({
  template: `<svg aria-hidden="true" />`,
});

describe("common UI components", () => {
  it("invokes enabled button actions and blocks disabled icon buttons", async () => {
    const action = vi.fn();
    const warningAction = vi.fn();
    const disabledAction = vi.fn();

    render(defineComponent({
      components: { UiButton, UiIconButton },
      setup() {
        return { action, disabledAction, TestIcon, warningAction };
      },
      template: `
        <UiButton variant="primary" agent-id="actions.run" @click="action">
          Run
        </UiButton>
        <UiButton variant="warning" agent-id="actions.warn" @click="warningAction">
          Warn
        </UiButton>
        <UiButton aria-label="Icon action" agent-id="actions.icon">
          <template #icon>
            <TestIcon />
          </template>
        </UiButton>
        <UiIconButton
          :icon="TestIcon"
          label="Pinned"
          variant="warning"
          active
          disabled
          agent-id="actions.pin"
          @click="disabledAction"
        />
      `,
    }));

    const runButton = screen.getByRole("button", { name: "Run" });
    const warningButton = screen.getByRole("button", { name: "Warn" });
    const iconOnlyButton = screen.getByRole("button", { name: "Icon action" });
    const pinnedButton = screen.getByRole("button", { name: "Pinned" });

    await fireEvent.click(runButton);
    await fireEvent.click(warningButton);
    await fireEvent.click(pinnedButton);

    expect(action).toHaveBeenCalledTimes(1);
    expect(warningAction).toHaveBeenCalledTimes(1);
    expect(disabledAction).not.toHaveBeenCalled();
    expect(pinnedButton).toBeDisabled();
    expect(runButton.querySelector(".ui-button__label")).toBeInTheDocument();
    expect(warningButton.querySelector(".ui-button__label")).toBeInTheDocument();
    expect(iconOnlyButton.querySelector(".ui-button__label")).toBeNull();
    expect(pinnedButton.querySelector(".ui-button__label")).toBeNull();
    expect(runButton).not.toHaveClass("ui-button--icon-only");
    expect(warningButton).not.toHaveClass("ui-button--icon-only");
    expect(iconOnlyButton).toHaveClass("ui-button--icon-only");
  });

  it("renders card, empty, and loading states through slots", () => {
    const view = render(defineComponent({
      components: { UiCard, UiEmptyState, UiSpinner },
      setup() {
        return { TestIcon };
      },
      template: `
        <UiCard title="Panel" loading agent-id="panel">
          <UiEmptyState :icon="TestIcon" title="No rows">
            Nothing to show.
          </UiEmptyState>
          <UiSpinner label="Working" />
        </UiCard>
        <UiCard variant="outlined" agent-id="panel.outlined">Outlined</UiCard>
        <UiCard variant="raised" agent-id="panel.raised">Raised</UiCard>
        <UiCard variant="flat" agent-id="panel.flat">Flat</UiCard>
      `,
    }));

    expect(view.container.querySelector("[data-agent-id='panel']")).toHaveClass("card", "card--surface");
    expect(view.container.querySelector("[data-agent-id='panel.outlined']")).toHaveClass("card--outlined");
    expect(view.container.querySelector("[data-agent-id='panel.raised']")).toHaveClass("card--raised");
    expect(view.container.querySelector("[data-agent-id='panel.flat']")).toHaveClass("card--flat");
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });

  it("updates text inputs and switches through v-model", async () => {
    const view = render(defineComponent({
      components: { UiInput, UiSwitch, UiTextarea },
      setup() {
        const name = ref("alpha");
        const notes = ref("draft");
        const enabled = ref(false);
        const locked = ref(false);
        return { enabled, locked, name, notes };
      },
      template: `
        <UiInput v-model="name" size="sm" aria-label="Name" />
        <UiTextarea v-model="notes" aria-label="Notes" />
        <UiSwitch v-model="enabled" label="Enable" />
        <UiSwitch v-model="locked" label="Locked" disabled />
        <output data-testid="values">{{ name }}|{{ notes }}|{{ String(enabled) }}|{{ String(locked) }}</output>
      `,
    }));

    await fireEvent.update(screen.getByRole("textbox", { name: "Name" }), "beta");
    await fireEvent.update(screen.getByRole("textbox", { name: "Notes" }), "ready");
    const enabledSwitch = screen.getByRole("switch", { name: "Enable" });
    const lockedSwitch = screen.getByRole("switch", { name: "Locked" });

    expect(enabledSwitch).toHaveAttribute("aria-checked", "false");
    await fireEvent.click(enabledSwitch);
    expect(enabledSwitch).toHaveAttribute("aria-checked", "true");
    expect(lockedSwitch).toBeDisabled();
    await fireEvent.click(lockedSwitch);

    expect(view.getByTestId("values")).toHaveTextContent("beta|ready|true|false");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveClass("ui-input--sm");
  });

  it("updates segmented and range controls inside settings rows", async () => {
    const options: UiSegmentedOption[] = [
      { value: "a", label: "A", agentId: "mode.a" },
      { value: "b", label: "B", agentId: "mode.b" },
    ];
    const view = render(defineComponent({
      components: { SettingsRow, UiRangeField, UiSegmentedControl },
      setup() {
        const mode = ref("a");
        const size = ref(4);
        return { mode, options, size };
      },
      template: `
        <SettingsRow label="Mode" hint="Choose one">
          <UiSegmentedControl v-model="mode" :options="options" aria-label="Mode" />
        </SettingsRow>
        <SettingsRow label="Size" divided agent-id="size.row">
          <UiRangeField
            v-model="size"
            :min="1"
            :max="8"
            unit="px"
            aria-label="Size"
            agent-id="size.range"
          />
        </SettingsRow>
        <output data-testid="values">{{ mode }}|{{ size }}</output>
      `,
    }));

    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");

    await fireEvent.click(screen.getByRole("radio", { name: "B" }));
    await fireEvent.update(screen.getByRole("slider", { name: "Size" }), "7");

    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "true");
    expect(view.container.querySelector(".settings-row:not(.settings-row--divided)")).toBeInTheDocument();
    expect(view.container.querySelector("[data-agent-id='size.row']")).toHaveClass("settings-row--divided");
    expect(view.container.querySelector("[data-agent-id='size.range']")).toBeInTheDocument();
    expect(view.getByTestId("values")).toHaveTextContent("b|7");
  });

  it("supports compact range output control and typed select values", async () => {
    const options: UiSelectOption[] = [
      { value: 1, label: "One" },
      { value: 2, label: "Two" },
      { value: 3, label: "Unavailable", disabled: true },
    ];
    const changed = vi.fn();
    const view = render(defineComponent({
      components: { UiRangeField, UiSelect },
      setup() {
        const range = ref(5);
        const selected = ref<string | number>(1);
        return { changed, options, range, selected };
      },
      template: `
        <UiRangeField
          v-model="range"
          :min="0"
          :max="10"
          size="sm"
          :show-output="false"
          aria-label="Zoom"
          @change="changed"
        />
        <UiSelect v-model="selected" :options="options" size="sm" aria-label="Mode" />
        <output data-testid="typed-value">{{ typeof selected }}:{{ selected }}</output>
      `,
    }));

    const slider = screen.getByRole("slider", { name: "Zoom" });
    expect(slider.closest(".ui-range-field")).toHaveClass("ui-range-field--sm");
    expect(slider.closest(".ui-range-field")?.querySelector("output")).toBeNull();

    await fireEvent.change(slider, { target: { value: "6" } });
    await fireEvent.update(screen.getByRole("combobox", { name: "Mode" }), "2");

    expect(changed).toHaveBeenCalledTimes(1);
    expect(view.getByTestId("typed-value")).toHaveTextContent("number:2");
    expect(screen.getByRole("option", { name: "Unavailable" })).toBeDisabled();
  });

  it("range field follows continuous input and ignores stale prop writes while dragging", async () => {
    let forceStale = () => {};
    const view = render(defineComponent({
      components: { UiRangeField },
      setup() {
        const size = ref(4);
        forceStale = () => {
          size.value = 4;
        };
        return { size };
      },
      template: `
        <UiRangeField
          :model-value="size"
          :min="1"
          :max="8"
          unit="px"
          aria-label="Size"
          @update:model-value="size = $event"
        />
        <output data-testid="values">{{ size }}</output>
      `,
    }));

    const slider = screen.getByRole("slider", { name: "Size" });
    const output = slider.closest(".ui-range-field")?.querySelector("output");

    await fireEvent.input(slider, { target: { value: "5" } });
    await fireEvent.input(slider, { target: { value: "6" } });
    await fireEvent.input(slider, { target: { value: "7" } });

    expect(slider).toHaveValue("7");
    expect(output).toHaveTextContent("7px");
    expect(view.getByTestId("values")).toHaveTextContent("7");

    await fireEvent.pointerDown(slider);
    await fireEvent.input(slider, { target: { value: "8" } });
    expect(slider).toHaveValue("8");
    expect(output).toHaveTextContent("8px");
    expect(view.getByTestId("values")).toHaveTextContent("8");

    forceStale();
    await Promise.resolve();
    expect(view.getByTestId("values")).toHaveTextContent("4");
    expect(slider).toHaveValue("8");
    expect(output).toHaveTextContent("8px");

    await fireEvent.pointerUp(slider);
    expect(slider).toHaveValue("4");
    expect(output).toHaveTextContent("4px");
  });

  it("exposes compact sidebar hierarchy, selection, metadata, tools, and collapse behavior", async () => {
    const select = vi.fn();
    const tool = vi.fn();
    const view = render(defineComponent({
      components: { LiliaSidebarRow, LiliaSidebarSection },
      setup() {
        const expanded = ref(true);
        return { expanded, select, tool };
      },
      template: `
        <LiliaSidebarSection
          v-model:expanded="expanded"
          title="Parameters"
          :count="2"
          agent-id="resources.parameters"
        >
          <LiliaSidebarRow
            label="Angle X"
            trailing="PARAM_ANGLE_X"
            :count="1"
            :depth="2"
            collapsible
            :expanded="expanded"
            ancestor-active
            agent-id="resources.parameter.angle-x"
            @select="select"
            @toggle="expanded = $event"
          >
            <template #tools>
              <button type="button" aria-label="Reset angle" @click="tool">Reset</button>
            </template>
          </LiliaSidebarRow>
        </LiliaSidebarSection>
      `,
    }));

    const sectionToggle = screen.getByRole("button", { name: /Parameters/ });
    const row = view.container.querySelector("[data-agent-id='resources.parameter.angle-x']");
    expect(row).toHaveClass("sb-tree__row");
    expect(row?.closest(".lilia-sidebar-row")).toHaveClass("is-ancestor-active");
    expect(row).toHaveTextContent("PARAM_ANGLE_X");
    expect(row?.closest(".lilia-sidebar-row")).toHaveStyle("--lilia-sidebar-depth: 2");
    expect(row?.querySelector(".lilia-sidebar-row__icon")).toBeNull();

    await fireEvent.click(row as Element);
    await fireEvent.click(screen.getByRole("button", { name: "Reset angle" }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(tool).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(row as Element, { key: "ArrowLeft" });
    expect(row).toHaveAttribute("aria-expanded", "false");
    await fireEvent.keyDown(row as Element, { key: "ArrowRight" });
    expect(row).toHaveAttribute("aria-expanded", "true");

    await fireEvent.click(sectionToggle);
    expect(sectionToggle).toHaveAttribute("aria-expanded", "false");
    expect(row).not.toBeVisible();
  });
});
