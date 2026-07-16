import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  UiInteractiveCard,
  UiListItem,
  UiProgress,
  UiSkeleton,
  UiStatusBadge,
  UiTabs,
  UiToast,
} from "@lilia/ui";

describe("contract feedback, navigation, and surface components", () => {
  it("supports tab selection and orientation-aware keyboard navigation", async () => {
    const view = render(defineComponent({
      components: { UiTabs },
      setup() {
        const active = ref<string | number>("one");
        const options = [
          { value: "one", label: "One" },
          { value: "disabled", label: "Disabled", disabled: true },
          { value: "two", label: "Two" },
        ];
        return { active, options };
      },
      template: `
        <UiTabs v-model="active" :options="options" aria-label="Sections" />
        <output data-testid="active">{{ active }}</output>
      `,
    }));
    await fireEvent.keyDown(screen.getByRole("tab", { name: "One" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(view.getByTestId("active")).toHaveTextContent("two");
  });

  it("emits actions from interactive surfaces and blocks disabled rows", async () => {
    const press = vi.fn();
    const select = vi.fn();
    render(defineComponent({
      components: { UiInteractiveCard, UiListItem },
      setup: () => ({ press, select }),
      template: `
        <UiInteractiveCard selected @press="press">Selected card</UiInteractiveCard>
        <UiListItem active @select="select">Active row</UiListItem>
        <UiListItem disabled @select="select">Disabled row</UiListItem>
      `,
    }));
    await fireEvent.click(screen.getByRole("button", { name: "Selected card" }));
    await fireEvent.click(screen.getByRole("button", { name: "Active row" }));
    await fireEvent.click(screen.getByRole("button", { name: "Disabled row" }));
    expect(press).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Disabled row" })).toBeDisabled();
  });

  it("renders actionable feedback with semantic states", async () => {
    const dismiss = vi.fn();
    const cancel = vi.fn();
    render(defineComponent({
      components: { UiProgress, UiSkeleton, UiStatusBadge, UiToast },
      setup: () => ({ cancel, dismiss }),
      template: `
        <UiToast title="Failed" description="Try again" tone="error" @dismiss="dismiss" />
        <UiProgress :value="25" :max="50" label="Uploading" cancellable @cancel="cancel" />
        <UiSkeleton label="Loading preview" width="8rem" height="2rem" />
        <UiStatusBadge tone="success" label="Connected" />
      `,
    }));
    expect(screen.getByRole("alert")).toHaveTextContent("Try again");
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toHaveAttribute("value", "25");
    expect(screen.getByRole("status", { name: "Loading preview" })).toHaveStyle({ width: "8rem", height: "2rem" });
    expect(screen.getByText("Connected")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "关闭通知" }));
    await fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
