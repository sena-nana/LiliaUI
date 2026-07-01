import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  SettingsRow,
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
  type UiSegmentedOption,
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
      `,
    }));

    expect(view.container.querySelector("[data-agent-id='panel']")?.classList.contains("card")).toBe(true);
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
        return { enabled, name, notes };
      },
      template: `
        <UiInput v-model="name" aria-label="Name" />
        <UiTextarea v-model="notes" aria-label="Notes" />
        <UiSwitch v-model="enabled" label="Enable" />
        <output data-testid="values">{{ name }}|{{ notes }}|{{ String(enabled) }}</output>
      `,
    }));

    await fireEvent.update(screen.getByRole("textbox", { name: "Name" }), "beta");
    await fireEvent.update(screen.getByRole("textbox", { name: "Notes" }), "ready");
    await fireEvent.click(screen.getByRole("checkbox", { name: "Enable" }));

    expect(view.getByTestId("values")).toHaveTextContent("beta|ready|true");
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
        <SettingsRow label="Size">
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
    expect(view.container.querySelector("[data-agent-id='size.range']")).toBeInTheDocument();
    expect(view.getByTestId("values")).toHaveTextContent("b|7");
  });
});
