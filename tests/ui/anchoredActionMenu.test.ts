import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  ActionMenuItem,
  AnchoredActionMenu,
  useAnchoredActionMenu,
} from "@lilia/ui";

function renderActionMenu(action = vi.fn()) {
  return render(defineComponent({
    components: { ActionMenuItem, AnchoredActionMenu },
    setup() {
      const menu = useAnchoredActionMenu();
      return { action, menu };
    },
    template: `
      <button type="button" @click="menu.openAtEvent">Open</button>
      <AnchoredActionMenu
        :open="menu.open.value"
        :position="menu.position.value"
        aria-label="Actions"
      >
        <ActionMenuItem agent-id="test.action" @click="action">
          Run action
        </ActionMenuItem>
      </AnchoredActionMenu>
    `,
  }));
}

describe("AnchoredActionMenu", () => {
  it("opens at the trigger event coordinates, teleports to body, invokes item actions, and closes on outside pointer", async () => {
    const action = vi.fn();
    const view = renderActionMenu(action);

    await fireEvent.click(screen.getByRole("button", { name: "Open" }), {
      clientX: 48,
      clientY: 64,
    });

    const menu = await screen.findByRole("menu", { name: "Actions" });
    expect(document.body.contains(menu)).toBe(true);
    expect(view.container.contains(menu)).toBe(false);
    await waitFor(() => {
      expect(menu).toHaveStyle({ left: "0px", top: "0px" });
      expect((menu as HTMLElement).style.getPropertyValue("translate")).toBe("48px 64px");
    });

    await fireEvent.click(screen.getByRole("menuitem", { name: "Run action" }));
    expect(action).toHaveBeenCalledTimes(1);

    await fireEvent.pointerDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("menu", { name: "Actions" })).not.toBeInTheDocument();
    });
  });

  it("closes on Escape", async () => {
    renderActionMenu();

    await fireEvent.click(screen.getByRole("button", { name: "Open" }), {
      clientX: 32,
      clientY: 40,
    });
    expect(await screen.findByRole("menu", { name: "Actions" })).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("menu", { name: "Actions" })).not.toBeInTheDocument();
    });
  });
});
