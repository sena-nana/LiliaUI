import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { UiDialog, UiDrawer, UiPopover, UiTooltip } from "@lilia/ui";

describe("contract overlay components", () => {
  it("traps dialog focus, closes on Escape, and restores the trigger", async () => {
    const view = render(defineComponent({
      components: { UiDialog },
      setup() {
        const open = ref(false);
        return { open };
      },
      template: `
        <button type="button" @click="open = true">Open dialog</button>
        <UiDialog v-model:open="open" title="Edit profile" description="Update details">
          <button type="button">First action</button>
          <template #footer><button type="button">Save</button></template>
        </UiDialog>
      `,
    }));

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    trigger.focus();
    await fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "关闭" })).toHaveFocus());
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await nextTick();
    expect(trigger).toHaveFocus();
    view.unmount();
  });

  it("applies semantic dialog sizes and keeps every close path disabled while busy", async () => {
    const update = vi.fn();
    const close = vi.fn();
    const { rerender } = render(UiDialog, {
      props: {
        open: true,
        title: "Workspace operation",
        size: "workspace",
        closeDisabled: true,
        closeAgentId: "workspace-operation.close",
        closeLabel: "Cancel workspace operation",
        "onUpdate:open": update,
        onClose: close,
      },
      slots: { default: `<button type="button">Continue</button>` },
    });

    const dialog = screen.getByRole("dialog", { name: "Workspace operation" });
    expect(dialog.firstElementChild).toHaveClass("ui-dialog__surface--workspace");
    const closeButton = screen.getByRole("button", { name: "Cancel workspace operation" });
    expect(closeButton).toBeDisabled();
    expect(closeButton).toHaveAttribute("data-agent-id", "workspace-operation.close");
    await fireEvent.click(closeButton);
    await fireEvent.keyDown(dialog, { key: "Escape" });
    await fireEvent.click(dialog);
    expect(update).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();

    await rerender({
      open: true,
      title: "Workspace operation",
      size: "medium",
      closeDisabled: true,
      closeAgentId: "workspace-operation.close",
      closeLabel: "Cancel workspace operation",
    });
    expect(screen.getByRole("dialog").firstElementChild).toHaveClass("ui-dialog__surface--medium");
  });

  it("supports drawer outside close and can keep the layer open by policy", async () => {
    const close = vi.fn();
    const { rerender } = render(UiDrawer, {
      props: { open: true, title: "Details", side: "left", "onUpdate:open": close },
      slots: { default: "Drawer content" },
    });
    const drawer = screen.getByRole("dialog", { name: "Details" });
    expect(drawer).toHaveClass("ui-drawer--left");
    await fireEvent.click(drawer);
    expect(close).toHaveBeenCalledWith(false);

    close.mockClear();
    await rerender({ open: true, title: "Details", side: "left", closeOnOutside: false });
    await fireEvent.click(screen.getByRole("dialog", { name: "Details" }));
    expect(close).not.toHaveBeenCalled();
  });

  it("opens a popover from keyboard, focuses content, and dismisses outside", async () => {
    const view = render(defineComponent({
      components: { UiPopover },
      setup() {
        const open = ref(false);
        return { open };
      },
      template: `
        <UiPopover v-model:open="open" aria-label="Available actions" agent-id="actions.popover">
          <template #trigger><button type="button">More</button></template>
          <button type="button">Rename</button>
        </UiPopover>
        <output data-testid="open">{{ String(open) }}</output>
      `,
    }));

    await fireEvent.keyDown(screen.getByRole("button", { name: "More" }), { key: "Enter" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Rename" })).toHaveFocus());
    expect(screen.getByRole("dialog", { name: "Available actions" })).toHaveAttribute("data-agent-id", "actions.popover");
    expect(view.getByTestId("open")).toHaveTextContent("true");
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: "Rename" })).not.toBeInTheDocument();
  });

  it("keeps outside and Escape dismissal policies independent", async () => {
    const update = vi.fn();
    render(UiPopover, {
      props: { open: true, closeOnOutside: false, "onUpdate:open": update },
      slots: {
        trigger: `<button type="button">Options</button>`,
        default: `<button type="button">Action</button>`,
      },
    });
    await fireEvent.pointerDown(document.body);
    expect(update).not.toHaveBeenCalled();
    await fireEvent.keyDown(document, { key: "Escape" });
    expect(update).toHaveBeenCalledWith(false);
  });

  it("preserves standalone tooltip rendering and supports delayed trigger mode", async () => {
    vi.useFakeTimers();
    render(defineComponent({
      components: { UiTooltip },
      template: `
        <UiTooltip id="tip" text="Standalone" />
        <UiTooltip text="Delayed" :delay-ms="20">
          <template #trigger="{ describedBy }">
            <button type="button" :aria-describedby="describedBy">Inspect</button>
          </template>
        </UiTooltip>
      `,
    }));
    expect(screen.getByRole("tooltip", { name: "Standalone" })).toBeInTheDocument();
    await fireEvent.focusIn(screen.getByRole("button", { name: "Inspect" }));
    await vi.advanceTimersByTimeAsync(20);
    await nextTick();
    const delayed = screen.getByRole("tooltip", { name: "Delayed" });
    expect(screen.getByRole("button", { name: "Inspect" })).toHaveAttribute("aria-describedby", delayed.id);
    vi.useRealTimers();
  });
});
