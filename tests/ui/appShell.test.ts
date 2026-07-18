import { render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import { LiliaAppShell, liliaShellOptionsKey } from "@lilia/ui/shell";

describe("LiliaAppShell window boundary", () => {
  it("renders window infrastructure without creating Router or navigation assumptions", () => {
    const NativeHost = defineComponent({ template: '<div data-testid="native-host">native</div>' });
    const Overlay = defineComponent({ template: '<div data-testid="overlay-host">overlay</div>' });
    const view = render(LiliaAppShell, {
      props: {
        title: "Workspace",
        agentId: "test.app-shell",
        overlayComponents: [Overlay],
      },
      slots: {
        default: '<section data-testid="workspace-content">content</section>',
        "native-host": NativeHost,
        "header-leading": '<button aria-label="workspace command">command</button>',
        "header-center": "center",
        "header-actions": "actions",
        overlays: '<div data-testid="slot-overlay">slot overlay</div>',
      },
    });

    expect(view.getByTestId("workspace-content")).toBeInTheDocument();
    expect(view.getByTestId("native-host")).toBeInTheDocument();
    expect(view.getByTestId("overlay-host")).toBeInTheDocument();
    expect(view.getByTestId("slot-overlay")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "workspace command" })).toBeInTheDocument();
    expect(view.getByText("center")).toBeVisible();
    expect(view.getByText("actions")).toBeVisible();
    expect(view.container.querySelector("[data-agent-id='test.app-shell']")).not.toBeNull();
    expect(view.container.querySelector("main")).toBeNull();
  });

  it("supports application-provided titlebar actions without owning application state", () => {
    const Actions = defineComponent({ template: '<button aria-label="injected action">run</button>' });
    const view = render(LiliaAppShell, {
      global: { provide: { [liliaShellOptionsKey as symbol]: { titlebarActions: Actions } } },
      slots: { default: "content" },
    });

    expect(view.getByRole("button", { name: "injected action" })).toBeVisible();
    expect(view.getByText("content")).toBeVisible();
  });
});
