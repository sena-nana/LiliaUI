import { render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { afterEach, describe, expect, it } from "vitest";

describe("public package entrypoints", () => {
  afterEach(async () => {
    const diagnostics = await import("@lilia/ui/diagnostics");
    diagnostics.uninstallAgentDebugHarness();
  });

  it("loads stable boundaries without installing diagnostics", async () => {
    const [root, calendar, search, overlay, shell, layouts, settings, runtime, tauriRuntime, commands, diagnostics] = await Promise.all([
      import("@lilia/ui"),
      import("@lilia/ui/calendar"),
      import("@lilia/ui/search"),
      import("@lilia/ui/overlay"),
      import("@lilia/ui/shell"),
      import("@lilia/ui/layouts"),
      import("@lilia/ui/settings"),
      import("@lilia/ui/runtime"),
      import("@lilia/ui/runtime/tauri"),
      import("@lilia/ui/commands"),
      import("@lilia/ui/diagnostics"),
    ]);

    expect(root.UiButton).toBeDefined();
    expect(calendar.CalendarHeatmap).toBeDefined();
    expect(search.SearchDropdown).toBeDefined();
    expect(overlay.OverlayHost).toBeDefined();
    expect(overlay.useOverlayActivity).toBeTypeOf("function");
    expect(shell.LiliaDesktopShell).toBeDefined();
    expect(shell.LiliaAppShell).toBeDefined();
    expect(layouts.LiliaWorkspace).toBeDefined();
    expect(layouts.LiliaWorkspaceRegion).toBeDefined();
    expect(layouts.useWorkspaceRegion).toBeTypeOf("function");
    expect(settings.createLiliaSettingsModel).toBeTypeOf("function");
    expect(runtime.installLiliaContextMenu).toBeTypeOf("function");
    expect(runtime.setNativeAppearanceAdapter).toBeTypeOf("function");
    expect(tauriRuntime.installTauriNativeAppearanceAdapter).toBeTypeOf("function");
    expect(commands.createCommandRegistry).toBeTypeOf("function");
    expect(diagnostics.installAgentDebugHarness).toBeTypeOf("function");
    expect(window.__liliaAgentDebug).toBeUndefined();
  });

  it("renders application-owned overlays through the router-free host", async () => {
    const { OverlayHost } = await import("@lilia/ui/overlay");
    const Overlay = defineComponent({ template: `<div data-testid="overlay">overlay</div>` });
    const view = render(OverlayHost, { props: { components: [Overlay] } });

    expect(view.getByTestId("overlay")).toBeInTheDocument();
  });
});
