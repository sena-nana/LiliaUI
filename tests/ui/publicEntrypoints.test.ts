import { render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { afterEach, describe, expect, it } from "vitest";

describe("public package entrypoints", () => {
  afterEach(async () => {
    const diagnostics = await import("@lilia/ui/diagnostics");
    diagnostics.uninstallAgentDebugHarness();
  });

  it("loads stable boundaries without installing diagnostics", async () => {
    const [root, calendar, search, overlay, presetDefinition, shell, shellApp, shellConfig, shellSidebar, layouts, settings, settingsSidebar, runtime, tauriRuntime, commands, diagnostics] = await Promise.all([
      import("@lilia/ui"),
      import("@lilia/ui/calendar"),
      import("@lilia/ui/search"),
      import("@lilia/ui/overlay"),
      import("@lilia/ui/preset/definition"),
      import("@lilia/ui/shell"),
      import("@lilia/ui/shell/app"),
      import("@lilia/ui/shell/config"),
      import("@lilia/ui/shell/sidebar"),
      import("@lilia/ui/layouts"),
      import("@lilia/ui/settings"),
      import("@lilia/ui/settings/sidebar"),
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
    expect(presetDefinition.liliaPresetDefinition.id).toBe("lilia");
    expect(shell.LiliaDesktopShell).toBeDefined();
    expect(shell.LiliaAppShell).toBeDefined();
    expect(shellApp.LiliaAppShell).toBe(shell.LiliaAppShell);
    expect(shellConfig.setLiliaUiConfig).toBeTypeOf("function");
    expect(shellSidebar.LiliaSidebarFrame).toBeDefined();
    expect(shellSidebar.LiliaSidebarNavRow).toBeDefined();
    expect(layouts.LiliaWorkspace).toBeDefined();
    expect(layouts.LiliaWorkspaceRegion).toBeDefined();
    expect(layouts.useWorkspaceRegion).toBeTypeOf("function");
    expect(settings.createLiliaSettingsModel).toBeTypeOf("function");
    expect(settingsSidebar.LiliaSettingsSidebar).toBeDefined();
    expect(runtime.installLiliaContextMenu).toBeTypeOf("function");
    expect(runtime.setNativeAppearanceAdapter).toBeTypeOf("function");
    expect(tauriRuntime.installTauriNativeAppearanceAdapter).toBeTypeOf("function");
    expect(commands.createCommandRegistry).toBeTypeOf("function");
    expect(diagnostics.installAgentDebugHarness).toBeTypeOf("function");
    expect(window.__liliaAgentDebug).toBeUndefined();
  });

  it("loads Nana desktop, diagnostics, and runtime entrypoints", async () => {
    const [shell, settings, runtime, tauriRuntime, diagnostics] = await Promise.all([
      import("@lilia/nana-ui/shell"),
      import("@lilia/nana-ui/settings"),
      import("@lilia/nana-ui/runtime"),
      import("@lilia/nana-ui/runtime/tauri"),
      import("@lilia/nana-ui/diagnostics"),
    ]);
    expect(shell.NanaTitleBar).toBeDefined();
    expect(shell.NanaAppShell).toBeDefined();
    expect(settings.NanaAppearanceSection).toBeDefined();
    expect(settings.NanaAboutSection).toBeDefined();
    expect(runtime.setNativeAppearanceAdapter).toBeTypeOf("function");
    expect(tauriRuntime.installTauriNativeAppearanceAdapter).toBeTypeOf("function");
    expect(diagnostics.installAgentDebugHarness).toBeTypeOf("function");
  });

  it("renders application-owned overlays through the router-free host", async () => {
    const { OverlayHost } = await import("@lilia/ui/overlay");
    const Overlay = defineComponent({ template: `<div data-testid="overlay">overlay</div>` });
    const view = render(OverlayHost, { props: { components: [Overlay] } });

    expect(view.getByTestId("overlay")).toBeInTheDocument();
  });
});
