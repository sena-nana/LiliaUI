import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import {
  NanaCard,
  NanaIconButton,
  NanaInteractiveCard,
  NanaListItem,
  NanaSegmentedControl,
  NanaTabs,
} from "@lilia/nana-ui";
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
        NanaCard,
        NanaIconButton,
        NanaInteractiveCard,
        NanaListItem,
        NanaSegmentedControl,
        NanaTabs,
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
          <NanaCard selected agent-id="nana.card">Nana card</NanaCard>
          <NanaInteractiveCard selected agent-id="nana.interactive-card">Nana interactive card</NanaInteractiveCard>
          <NanaListItem selected agent-id="nana.list-item">Nana list item</NanaListItem>
          <UiTabs model-value="one" :options="[{ value: 'one', label: 'Lilia One' }, { value: 'two', label: 'Lilia Two' }]" />
          <NanaTabs model-value="one" :options="[{ value: 'one', label: 'Nana One' }, { value: 'two', label: 'Nana Two' }]" />
          <UiSegmentedControl model-value="one" :options="[{ value: 'one', label: 'Lilia Segment One' }, { value: 'two', label: 'Lilia Segment Two' }]" />
          <NanaSegmentedControl model-value="one" :options="[{ value: 'one', label: 'Nana Segment One' }, { value: 'two', label: 'Nana Segment Two' }]" />
          <UiIconButton icon="span" label="Pin toolbar" active />
          <NanaIconButton icon="span" label="Nana pin toolbar" active />
        </section>
      `,
    });

    const selectedComponentRoots = [
      "lilia.card",
      "lilia.interactive-card",
      "lilia.list-item",
      "nana.card",
      "nana.interactive-card",
      "nana.list-item",
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

    const nanaRow = screen.getByRole("button", { name: "Nana list item" });
    expect(nanaRow).toHaveAttribute("aria-pressed", "true");

    const liliaInteractiveCard = screen.getByRole("button", { name: "Lilia interactive card" });
    expect(liliaInteractiveCard).toHaveAttribute("aria-pressed", "true");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-backdrop", "css-blur");
    expect(liliaInteractiveCard).toHaveAttribute("data-lilia-surface-boundary");
    expect(screen.getByRole("button", { name: "Nana interactive card" })).toHaveAttribute("aria-pressed", "true");

    for (const name of ["Lilia One", "Nana One"]) {
      const tab = screen.getByRole("tab", { name });
      expect(tab).toHaveAttribute("data-lilia-selected", "true");
      expect(tab).not.toHaveAttribute("data-lilia-selected-indicator");
      expect(tab).toHaveAttribute("aria-selected", "true");
    }

    for (const name of ["Lilia Segment One", "Nana Segment One"]) {
      const option = screen.getByRole("radio", { name });
      expect(option).toHaveAttribute("data-lilia-selected", "true");
      expect(option).not.toHaveAttribute("data-lilia-selected-indicator");
      expect(option).toHaveAttribute("aria-checked", "true");
    }

    for (const name of ["Pin toolbar", "Nana pin toolbar"]) {
      const toolbarToggle = screen.getByRole("button", { name });
      expect(toolbarToggle).toHaveAttribute("data-lilia-selected", "true");
      expect(toolbarToggle).not.toHaveAttribute("data-lilia-selected-indicator");
      expect(toolbarToggle).toHaveAttribute("aria-pressed", "true");
    }
  });
});
