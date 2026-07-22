import { cleanup, fireEvent, render } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import * as Lilia from "@lilia/ui";

const api = Lilia;
const TestIcon = defineComponent(() => () => h("span", { "aria-hidden": "true" }, "◆"));

afterEach(cleanup);

describe("Lilia Contract layer", () => {
  it("keeps disabled, loading, invalid, ARIA and model events aligned for form controls", async () => {
    const button = render(api.Button, {
      props: { loading: true, invalid: true },
      slots: { default: "Run" },
    });
    expect(button.getByRole("button", { name: "Run" })).toBeDisabled();
    expect(button.getByRole("button", { name: "Run" })).toHaveAttribute("aria-busy", "true");
    expect(button.getByRole("button", { name: "Run" })).toHaveAttribute("aria-invalid", "true");
    button.unmount();

    const input = render(api.Input, {
      props: {
        modelValue: 12,
        name: "amount",
        placeholder: "Amount",
        required: true,
        invalid: true,
        ariaLabel: "Amount",
        ariaDescribedby: "amount-error",
      },
    });
    const inputElement = input.getByRole("textbox", { name: "Amount" });
    expect(inputElement).toHaveAttribute("aria-describedby", "amount-error");
    expect(inputElement).toHaveAttribute("aria-invalid", "true");
    await fireEvent.update(inputElement, "13");
    expect(input.emitted("update:modelValue")?.[0]).toEqual(["13"]);
    input.unmount();

    const textarea = render(api.Textarea, {
      props: { modelValue: "a", loading: true, invalid: true, ariaLabel: "Notes" },
    });
    expect(textarea.getByRole("textbox", { name: "Notes" })).toBeDisabled();
    expect(textarea.getByRole("textbox", { name: "Notes" })).toHaveAttribute("aria-invalid", "true");
    textarea.unmount();

    const select = render(api.Select, {
      props: {
        modelValue: 1,
        options: [{ value: 1, label: "One" }, { value: 2, label: "Two" }],
        ariaLabel: "Count",
      },
    });
    await fireEvent.update(select.getByRole("combobox", { name: "Count" }), "2");
    expect(select.emitted("update:modelValue")?.[0]).toEqual([2]);
    expect(typeof select.emitted("update:modelValue")?.[0]?.[0]).toBe("number");
    select.unmount();

    const checkbox = render(api.Checkbox, {
      props: { modelValue: false, label: "Accept", loading: true, invalid: true },
    });
    expect(checkbox.getByRole("checkbox", { name: "Accept" })).toBeDisabled();
    expect(checkbox.getByRole("checkbox", { name: "Accept" })).toHaveAttribute("aria-invalid", "true");
    checkbox.unmount();

    const toggle = render(api.Switch, {
      props: { modelValue: false, label: "Enabled", loading: false, invalid: true },
    });
    await fireEvent.click(toggle.getByRole("switch", { name: "Enabled" }));
    expect(toggle.emitted("update:modelValue")?.[0]).toEqual([true]);
    expect(toggle.emitted("change")?.[0]?.[0]).toBeInstanceOf(Event);
    toggle.unmount();

    const slider = render(api.Slider, {
      props: { modelValue: 5, min: 0, max: 10, invalid: true, ariaLabel: "Level" },
    });
    await fireEvent.update(slider.getByRole("slider", { name: "Level" }), "7");
    expect(slider.emitted("update:modelValue")?.[0]).toEqual([7]);
    expect(slider.getByRole("slider", { name: "Level" })).toHaveAttribute("aria-invalid", "true");

    const iconButton = render(api.IconButton, {
      props: { icon: TestIcon, label: "Tools", active: true, invalid: true },
    });
    expect(iconButton.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-pressed", "true");
    expect(iconButton.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-invalid", "true");
  });

  it("shares field wiring and validation message semantics", () => {
    const field = render(api.FormField, {
      props: {
        label: "Project name",
        hint: "Required field",
        error: "Name is required",
        controlId: "project-name",
        agentId: "contract.project-name",
      },
      slots: {
        default: ({ controlId, describedBy, invalid }: {
          controlId: string;
          describedBy?: string;
          invalid: boolean;
        }) => h(api.Input, {
          ariaDescribedby: describedBy,
          ariaLabel: "Project name",
          invalid,
          name: controlId,
        }),
      },
    });
    expect(field.getByRole("textbox", { name: "Project name" })).toHaveAttribute("aria-invalid", "true");
    expect(field.getByRole("textbox", { name: "Project name" }).getAttribute("aria-describedby")).toContain("project-name");
    expect(field.getByRole("alert")).toHaveTextContent("Name is required");
    field.unmount();

    const validation = render(api.ValidationMessage, {
      props: { message: "Check this value", intent: "warning", agentId: "contract.warning" },
    });
    expect(validation.getByText("Check this value")).toHaveAttribute("data-agent-id", "contract.warning");
  });

  it("shares dialog close policy and canonical title/footer slots", async () => {
    const view = render(api.Dialog, {
      props: {
        open: true,
        title: "Fallback title",
        closeDisabled: true,
        closeLabel: "Dismiss",
        closeAgentId: "dialog.close",
      },
      slots: { title: "Contract title", default: "Body", footer: "Footer" },
    });
    expect(view.getByRole("dialog", { name: "Fallback title" })).toBeInTheDocument();
    expect(view.getByText("Contract title")).toBeInTheDocument();
    expect(view.getByText("Footer")).toBeInTheDocument();
    const close = view.getByRole("button", { name: "Dismiss" });
    expect(close).toBeDisabled();
    expect(close).toHaveAttribute("data-agent-id", "dialog.close");
    await fireEvent.click(close);
    expect(view.emitted("close")).toBeUndefined();
    await view.rerender({ closeDisabled: false });
    await fireEvent.click(view.getByRole("button", { name: "Dismiss" }));
    expect(view.emitted("update:open")?.[0]).toEqual([false]);
    expect(view.emitted("close")).toHaveLength(1);
  });

  it("shares drawer and popover open-state events", async () => {
    const drawer = render(api.Drawer, {
      props: { open: true, title: "Inspector", closeLabel: "Close inspector" },
      slots: { default: "Drawer body", footer: "Drawer footer" },
    });
    expect(drawer.getByRole("dialog", { name: "Inspector" })).toBeInTheDocument();
    expect(drawer.getByText("Drawer footer")).toBeInTheDocument();
    await fireEvent.click(drawer.getByRole("button", { name: "Close inspector" }));
    expect(drawer.emitted("update:open")?.[0]).toEqual([false]);
    expect(drawer.emitted("close")).toHaveLength(1);
    drawer.unmount();

    const popover = render(api.Popover, {
      props: { open: true, ariaLabel: "Actions" },
      slots: {
        trigger: h("button", { type: "button" }, "Toggle actions"),
        default: h("button", { type: "button" }, "Run action"),
      },
    });
    expect(popover.getByRole("dialog", { name: "Actions" })).toBeInTheDocument();
    await fireEvent.click(popover.getByRole("button", { name: "Toggle actions" }));
    expect(popover.emitted("update:open")?.[0]).toEqual([false]);
    expect(popover.emitted("close")).toHaveLength(1);
  });

  it("supports the same tooltip trigger/content slot contract", () => {
    const view = render(api.Tooltip, {
      props: { open: true, text: "Fallback" },
      slots: {
        trigger: ({ describedBy }: { describedBy?: string }) => h("button", {
          "aria-describedby": describedBy,
        }, "Help"),
        default: "Contract tooltip",
      },
    });
    const tooltip = view.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Contract tooltip");
    expect(view.getByRole("button", { name: "Help" })).toHaveAttribute(
      "aria-describedby",
      tooltip.id,
    );
  });

  it("uses one roving-focus behavior for tabs and segmented controls", async () => {
    for (const component of [api.Tabs, api.SegmentedControl]) {
      const role = component === api.Tabs ? "tab" : "radio";
      const view = render(component, {
        props: {
          modelValue: "missing",
          ariaLabel: "Views",
          options: [
            { value: "disabled", label: "Disabled", disabled: true },
            { value: "first", label: "First" },
            { value: "last", label: "Last" },
          ],
        },
      });
      const first = view.getByRole(role, { name: "First" });
      const last = view.getByRole(role, { name: "Last" });
      expect(first).toHaveAttribute("tabindex", "0");
      expect(view.getByRole(role, { name: "Disabled" })).toHaveAttribute("tabindex", "-1");
      await fireEvent.keyDown(first, { key: "End" });
      expect(document.activeElement).toBe(last);
      expect(view.emitted("update:modelValue")?.[0]).toEqual(["last"]);
      await fireEvent.keyDown(last, { key: "Home" });
      expect(document.activeElement).toBe(first);
      await view.rerender({
        modelValue: "gone",
        options: [{ value: "next", label: "Next" }],
      });
      expect(view.getByRole(role, { name: "Next" })).toHaveAttribute("tabindex", "0");
      view.unmount();

      const empty = render(component, {
        props: { modelValue: "none", ariaLabel: "Empty", options: [] },
      });
      expect(empty.queryAllByRole(role)).toHaveLength(0);
      empty.unmount();
    }
  });

  it("keeps feedback and selectable surface semantics aligned", async () => {
    const toast = render(api.Toast, {
      props: { title: "Failed", tone: "error", dismissible: true },
    });
    expect(toast.getByRole("alert")).toHaveTextContent("Failed");
    await fireEvent.click(toast.getByRole("button"));
    expect(toast.emitted("dismiss")).toHaveLength(1);
    toast.unmount();

    const progress = render(api.Progress, {
      props: { label: "Upload", value: 150, max: 100, cancellable: true },
    });
    expect(progress.getByRole("progressbar", { name: "Upload" })).toHaveAttribute("aria-valuenow", "100");
    await fireEvent.click(progress.getByRole("button", { name: "取消" }));
    expect(progress.emitted("cancel")).toHaveLength(1);
    progress.unmount();

    const skeleton = render(api.Skeleton, { props: { label: "Loading details" } });
    expect(skeleton.getByRole("status", { name: "Loading details" })).toBeInTheDocument();
    skeleton.unmount();

    const badge = render(api.StatusBadge, {
      props: { label: "Ready", tone: "success" },
      slots: { default: "Contract ready" },
    });
    expect(badge.getByText("Contract ready")).toBeInTheDocument();
    badge.unmount();

    const card = render(api.Card, { props: { selected: true, disabled: true } });
    expect(card.container.firstElementChild).toHaveAttribute("data-lilia-selected", "true");
    expect(card.container.firstElementChild).toHaveAttribute("aria-disabled", "true");
    card.unmount();

    const interactive = render(api.InteractiveCard, {
      props: { selected: true },
      slots: { default: "Open project" },
    });
    await fireEvent.click(interactive.getByRole("button", { name: "Open project" }));
    expect(interactive.emitted("select")).toHaveLength(1);
    expect(interactive.emitted("press")).toHaveLength(1);
    expect(interactive.emitted("click")).toHaveLength(1);
    interactive.unmount();

    const item = render(api.ListItem, {
      props: { selected: true, disabled: true },
      slots: { default: "Item" },
    });
    expect(item.getByRole("button", { name: "Item" })).toBeDisabled();
    expect(item.getByRole("button", { name: "Item" })).toHaveAttribute("data-lilia-selected", "true");
  });
});
