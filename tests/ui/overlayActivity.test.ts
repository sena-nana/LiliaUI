import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnchoredActionMenu,
  ConfirmDialog,
  Dropdown,
  SearchDropdown,
  UiDialog,
  UiDrawer,
} from "@lilia/ui";
import ContextMenuHost from "@lilia/ui/components/ContextMenuHost";
import { SB_MENU_POP_TRANSITION_MS } from "@lilia/ui/composables/menuMotion";
import {
  useOverlayActivity,
  useOverlayPresence,
} from "@lilia/ui/composables/useOverlayActivity";
import {
  closeContextMenu,
  openContextMenuAt,
} from "@lilia/ui/composables/useContextMenu";

const ActivityProbe = defineComponent({
  setup() {
    const active = useOverlayActivity();
    return { active };
  },
  template: `<output data-testid="overlay-activity">{{ String(active) }}</output>`,
});

const PresenceControls = defineComponent({
  props: { name: { type: String, required: true } },
  setup() {
    return useOverlayPresence();
  },
  template: `
    <button type="button" @click="activate">Activate {{ name }}</button>
    <button type="button" @click="deactivate">Deactivate {{ name }}</button>
  `,
});

function expectActivity(active: boolean) {
  expect(screen.getByTestId("overlay-activity")).toHaveTextContent(String(active));
}

async function expectActivityEventually(active: boolean) {
  await waitFor(() => expectActivity(active));
}

afterEach(() => {
  closeContextMenu();
  vi.useRealTimers();
});

describe("overlay activity", () => {
  it("tracks multiple idempotent presences and cleans up tokens on unmount", async () => {
    render(ActivityProbe);
    const first = render(PresenceControls, { props: { name: "first" } });
    const second = render(PresenceControls, { props: { name: "second" } });

    expectActivity(false);
    await fireEvent.click(screen.getByRole("button", { name: "Activate first" }));
    await fireEvent.click(screen.getByRole("button", { name: "Activate first" }));
    expectActivity(true);

    await fireEvent.click(screen.getByRole("button", { name: "Activate second" }));
    await fireEvent.click(screen.getByRole("button", { name: "Deactivate first" }));
    expectActivity(true);

    first.unmount();
    await nextTick();
    expectActivity(true);

    second.unmount();
    await nextTick();
    expectActivity(false);
  });

  it("registers every shared Teleport overlay and releases activity when its owner unmounts", async () => {
    render(ActivityProbe);

    const confirm = render(ConfirmDialog, {
      props: { open: true, title: "Confirm", message: "Continue?" },
    });
    await expectActivityEventually(true);
    confirm.unmount();
    await expectActivityEventually(false);

    const actionMenu = render(AnchoredActionMenu, {
      props: {
        open: true,
        position: { x: 0, y: 0, anchorX: 0, anchorY: 0 },
        ariaLabel: "Actions",
      },
    });
    await expectActivityEventually(true);
    actionMenu.unmount();
    await expectActivityEventually(false);

    const dropdown = render(Dropdown, {
      props: {
        modelValue: "one",
        options: [{ value: "one", label: "One" }],
      },
      global: { stubs: { transition: false } },
    });
    await fireEvent.click(screen.getByRole("button", { name: "One" }));
    await expectActivityEventually(true);
    dropdown.unmount();
    await expectActivityEventually(false);

    const search = render(SearchDropdown, {
      props: { modelValue: "", open: true },
    });
    await expectActivityEventually(true);
    search.unmount();
    await expectActivityEventually(false);

    const contextMenu = render(ContextMenuHost);
    openContextMenuAt(0, 0, [{ id: "open", label: "Open", onSelect: vi.fn() }]);
    await expectActivityEventually(true);
    contextMenu.unmount();
    await expectActivityEventually(false);
    closeContextMenu();

    const dialog = render(UiDialog, {
      props: { open: true, title: "Dialog" },
    });
    await expectActivityEventually(true);
    dialog.unmount();
    await expectActivityEventually(false);

    const drawer = render(UiDrawer, {
      props: { open: true, title: "Drawer" },
    });
    await expectActivityEventually(true);
    drawer.unmount();
    await expectActivityEventually(false);
  });

  it("keeps activity during leave and ignores an interrupted leave from a rapid reopen", async () => {
    vi.useFakeTimers();
    render(defineComponent({
      components: { ActivityProbe, AnchoredActionMenu },
      setup() {
        const open = ref(false);
        const position = { x: 0, y: 0, anchorX: 0, anchorY: 0 };
        return { open, position };
      },
      template: `
        <button type="button" @click="open = true">Open menu</button>
        <button type="button" @click="open = false">Close menu</button>
        <ActivityProbe />
        <AnchoredActionMenu
          :open="open"
          :position="position"
          aria-label="Actions"
        />
      `,
    }), {
      global: { stubs: { transition: false } },
    });

    expectActivity(false);
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expectActivity(true);

    await fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expectActivity(true);
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await vi.advanceTimersByTimeAsync(SB_MENU_POP_TRANSITION_MS + 50);
    await nextTick();
    expectActivity(true);

    await fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expectActivity(true);
    await vi.advanceTimersByTimeAsync(SB_MENU_POP_TRANSITION_MS + 50);
    await nextTick();
    expectActivity(false);
  });
});
