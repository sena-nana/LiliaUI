import { fireEvent, render, screen } from "@testing-library/vue";
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

    await fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    await fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(cancel).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledOnce();
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
        cancelText: "Stop",
        busy: true,
        busyText: "Working",
        onConfirm: confirm,
        onCancel: cancel,
      },
    });

    const cancelButton = screen.getByRole("button", { name: "Stop" });
    const confirmButton = screen.getByRole("button", { name: "Working" });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();

    await fireEvent.click(cancelButton);
    await fireEvent.click(confirmButton);

    expect(cancel).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
