import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import {
  UiCard,
  UiIconButton,
  UiInteractiveCard,
  UiListItem,
  UiSegmentedControl,
  UiTabs,
} from "@lilia/ui";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";

describe("surface material and interaction state contract", () => {
  it("resolves explicit surface dimensions without assigning backdrop ownership to a solid surface", () => {
    expect(resolveSurfaceAttributes()).toEqual({
      "data-lilia-surface-mode": "solid",
      "data-lilia-backdrop": "none",
      "data-lilia-surface-level": "base",
    });
    expect(resolveSurfaceAttributes({
      surfaceMode: "solid",
      backdropEffect: "css-blur",
      surfaceLevel: "raised",
      surfaceBoundary: true,
    })).toEqual({
      "data-lilia-surface-mode": "solid",
      "data-lilia-backdrop": "none",
      "data-lilia-surface-level": "raised",
      "data-lilia-surface-boundary": "",
    });
    expect(resolveSurfaceAttributes({
      surfaceMode: "translucent",
      backdropEffect: "css-blur",
    })["data-lilia-backdrop"]).toBe("css-blur");
    expect(resolveSurfaceAttributes({
      surfaceMode: "solid",
      backdropEffect: "native",
    })["data-lilia-backdrop"]).toBe("none");
  });

  it("maps persistent selection without edge indicators and keeps ARIA semantics", async () => {
    const { container } = render({
      components: {
        UiCard,
        UiIconButton,
        UiInteractiveCard,
        UiListItem,
        UiSegmentedControl,
        UiTabs,
      },
      template: `
        <section data-lilia-surface-mode="translucent" data-lilia-backdrop="native">
          <UiCard selected agent-id="lilia.card">Lilia card</UiCard>
          <UiInteractiveCard surface-mode="translucent" backdrop-effect="css-blur" selected agent-id="lilia.interactive-card">Lilia interactive card</UiInteractiveCard>
          <UiListItem selected agent-id="lilia.list-item">Lilia list item</UiListItem>
          <UiTabs model-value="one" :options="[{ value: 'one', label: 'Lilia One' }, { value: 'two', label: 'Lilia Two' }]" />
          <UiSegmentedControl model-value="one" :options="[{ value: 'one', label: 'Lilia Segment One' }, { value: 'two', label: 'Lilia Segment Two' }]" />
          <UiIconButton icon="span" label="Pin toolbar" active />
        </section>
      `,
    });

    const selectedComponentRoots = [
      "lilia.card",
      "lilia.interactive-card",
      "lilia.list-item",
    ].map((agentId) => container.querySelector<HTMLElement>(`[data-agent-id='${agentId}']`));
    expect(selectedComponentRoots).not.toContain(null);
    for (const root of selectedComponentRoots) {
      expect(root).toHaveAttribute("data-lilia-selected", "true");
      expect(root).not.toHaveAttribute("data-lilia-selected-indicator");
      expect(root?.querySelector("[data-lilia-selected-indicator]")).toBeNull();
    }

    const liliaRow = screen.getByRole("button", { name: "Lilia list item" });
    expect(liliaRow).toHaveAttribute("aria-pressed", "true");
    liliaRow.focus();
    expect(liliaRow).toHaveFocus();

    const liliaInteractiveCard = screen.getByRole("button", { name: "Lilia interactive card" });
    expect(liliaInteractiveCard).toHaveAttribute("aria-pressed", "true");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-backdrop", "css-blur");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-surface-boundary");

    const tab = screen.getByRole("tab", { name: "Lilia One" });
    expect(tab).toHaveAttribute("data-lilia-selected", "true");
    expect(tab).not.toHaveAttribute("data-lilia-selected-indicator");
    expect(tab).toHaveAttribute("aria-selected", "true");

    const option = screen.getByRole("radio", { name: "Lilia Segment One" });
    expect(option).toHaveAttribute("data-lilia-selected", "true");
    expect(option).not.toHaveAttribute("data-lilia-selected-indicator");
    expect(option).toHaveAttribute("aria-checked", "true");

    const toolbarToggle = screen.getByRole("button", { name: "Pin toolbar" });
    expect(toolbarToggle).toHaveAttribute("data-lilia-selected", "true");
    expect(toolbarToggle).not.toHaveAttribute("data-lilia-selected-indicator");
    expect(toolbarToggle).toHaveAttribute("aria-pressed", "true");
  });
});
