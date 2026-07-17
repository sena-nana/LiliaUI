import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { UiIconButton, UiInteractiveCard, UiListItem, UiTabs } from "@lilia/ui";
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

  it("maps persistent selection to a non-color state signal and keeps focus semantics", async () => {
    render({
      components: { UiIconButton, UiInteractiveCard, UiListItem, UiTabs },
      template: `
        <section data-lilia-surface-mode="translucent" data-lilia-backdrop="native">
          <UiListItem selected>Selected row</UiListItem>
          <UiTabs model-value="one" :options="[{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }]" />
          <UiIconButton icon="span" label="Pin toolbar" active />
          <UiInteractiveCard surface-mode="translucent" backdrop-effect="css-blur" selected>
            Selected card
          </UiInteractiveCard>
        </section>
      `,
    });

    const row = screen.getByRole("button", { name: "Selected row" });
    expect(row).toHaveAttribute("data-lilia-selected", "true");
    expect(row).toHaveAttribute("aria-pressed", "true");
    row.focus();
    expect(row).toHaveFocus();

    const tab = screen.getByRole("tab", { name: "One" });
    expect(tab).toHaveAttribute("data-lilia-selected", "true");
    expect(tab).toHaveAttribute("aria-selected", "true");

    const toolbarToggle = screen.getByRole("button", { name: "Pin toolbar" });
    expect(toolbarToggle).toHaveAttribute("data-lilia-selected", "true");
    expect(toolbarToggle).toHaveAttribute("aria-pressed", "true");

    const card = screen.getByRole("button", { name: "Selected card" });
    expect(card).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(card).toHaveAttribute("data-lilia-backdrop", "css-blur");
    expect(card).toHaveAttribute("data-lilia-surface-boundary");
  });
});
