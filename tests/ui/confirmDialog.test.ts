import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@lilia/ui";

describe("ConfirmDialog", () => {
  it("emits cancel and confirm actions from dialog buttons", async () => {
    const confirm = vi.fn();
    const cancel = vi.fn();

    render(ConfirmDialog, {
      props: {
        open: true,
        title: "Delete item",
        message: "This cannot be undone.",
        confirmText: "Delete",
        cancelText: "Keep",
        danger: true,
        onConfirm: confirm,
        onCancel: cancel,
      },
    });

    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    await fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(cancel).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("supports an independent secondary decision", async () => {
    const confirm = vi.fn();
    const secondary = vi.fn();
    const cancel = vi.fn();

    render(ConfirmDialog, {
      props: {
        open: true,
        title: "Unsaved project",
        message: "Choose how to continue.",
        confirmText: "Save",
        secondaryText: "Discard",
        cancelText: "Cancel",
        onConfirm: confirm,
        onSecondary: secondary,
        onCancel: cancel,
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(secondary).toHaveBeenCalledOnce();
    expect(confirm).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("moves focus into the dialog, traps Tab, and restores the trigger", async () => {
    const Host = defineComponent({
      components: { ConfirmDialog },
      setup() {
        const open = ref(false);
        return { open };
      },
      template: `
        <button type="button" @click="open = true">Open decision</button>
        <ConfirmDialog
          :open="open"
          title="Unsaved project"
          message="Choose how to continue."
          confirm-text="Save"
          secondary-text="Discard"
          cancel-text="Cancel"
          @cancel="open = false"
        />
      `,
    });
    render(Host);
    const trigger = screen.getByRole("button", { name: "Open decision" });

    trigger.focus();
    await fireEvent.click(trigger);
    const confirmButton = await screen.findByRole("button", { name: "Save" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const secondaryButton = screen.getByRole("button", { name: "Discard" });
    await waitFor(() => expect(confirmButton).toHaveFocus());

    await fireEvent.keyDown(confirmButton, { key: "Tab" });
    expect(cancelButton).toHaveFocus();
    await fireEvent.keyDown(cancelButton, { key: "Tab", shiftKey: true });
    expect(confirmButton).toHaveFocus();
    await fireEvent.keyDown(confirmButton, { key: "Tab", shiftKey: true });
    expect(secondaryButton).toHaveFocus();

    await fireEvent.keyDown(secondaryButton, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps actions disabled while busy", async () => {
    const confirm = vi.fn();
    const cancel = vi.fn();

    render(ConfirmDialog, {
      props: {
        open: true,
        title: "Sync",
        message: "Working.",
        confirmText: "Start",
        secondaryText: "Skip",
        cancelText: "Stop",
        busy: true,
        busyText: "Working",
        onConfirm: confirm,
        onCancel: cancel,
      },
    });

    const cancelButton = screen.getByRole("button", { name: "Stop" });
    const confirmButton = screen.getByRole("button", { name: "Working" });
    const secondaryButton = screen.getByRole("button", { name: "Skip" });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
    expect(secondaryButton).toBeDisabled();

    await fireEvent.click(cancelButton);
    await fireEvent.click(confirmButton);
    await fireEvent.click(secondaryButton);
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await fireEvent.click(screen.getByRole("dialog"));

    expect(cancel).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
