import { fireEvent, render, waitFor } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LiliaBottomPanel,
  LiliaGlobalNavigation,
  LiliaInspector,
  LiliaPrimaryContent,
  LiliaResourcePanel,
  LiliaSectionNavigation,
  LiliaWorkspace,
  LiliaWorkspaceRegion,
  useWorkspaceRegion,
} from "@lilia/ui/layouts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function region(container: HTMLElement, id: string) {
  const element = container.querySelector(`[data-region-id="${id}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing workspace region: ${id}`);
  return element;
}

describe("Workspace Region layout", () => {
  it("registers preset defaults without requiring role and preserves explicit overrides", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaResourcePanel, { id: "resources" }),
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaInspector, { id: "inspector" }),
          h(LiliaInspector, { id: "console", role: "console" }),
        ],
      },
    });
    const workspace = view.container.querySelector(".lilia-workspace");
    if (!(workspace instanceof HTMLElement)) throw new Error("Missing workspace");

    await waitFor(() => {
      expect(region(view.container, "resources")).toHaveAttribute("data-region-role", "resources");
      expect(region(view.container, "resources")).toHaveAttribute("data-region-placement", "start");
      expect(region(view.container, "resources")).not.toHaveAttribute("hidden");
      expect(region(view.container, "primary")).toHaveAttribute("data-region-role", "primary");
      expect(region(view.container, "primary")).toHaveAttribute("data-region-placement", "primary");
      expect(region(view.container, "primary")).not.toHaveAttribute("hidden");
      expect(region(view.container, "inspector")).toHaveAttribute("data-region-role", "inspector");
      expect(region(view.container, "inspector")).toHaveAttribute("data-region-placement", "end");
      expect(region(view.container, "inspector")).not.toHaveAttribute("hidden");
      expect(region(view.container, "console")).toHaveAttribute("data-region-role", "console");
      expect(workspace).toHaveAttribute("data-has-primary", "true");
    });
  });

  it("publishes the default Surface boundary and keeps backdrop ownership on a translucent workspace", () => {
    const view = render(LiliaWorkspace, {
      props: {
        agentId: "workspace.repository",
        surfaceMode: "translucent",
        surfaceLevel: "raised",
      },
      slots: {
        default: () => h(LiliaResourcePanel, {
          id: "resources",
          surfaceMode: "translucent",
          surfaceLevel: "raised",
        }),
      },
    });

    const workspace = view.container.querySelector(".lilia-workspace");
    if (!(workspace instanceof HTMLElement)) throw new Error("Missing workspace");
    const resources = region(view.container, "resources");

    expect(workspace).toHaveAttribute("data-agent-id", "workspace.repository");
    expect(workspace).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(workspace).toHaveAttribute("data-lilia-backdrop", "native");
    expect(workspace).toHaveAttribute("data-lilia-surface-level", "raised");
    expect(workspace).toHaveAttribute("data-lilia-surface-boundary");

    expect(resources).toHaveAttribute("data-agent-id", "workspace.region.resources");
    expect(resources).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(resources).toHaveAttribute("data-lilia-backdrop", "none");
    expect(resources).toHaveAttribute("data-lilia-surface-level", "raised");
    expect(resources).toHaveAttribute("data-lilia-surface-boundary");
  });

  it("allows explicit Surface overrides without weakening the stable Region Agent target", () => {
    const view = render(LiliaWorkspace, {
      props: {
        backdropEffect: "css-blur",
        surfaceBoundary: false,
        surfaceMode: "translucent",
      },
      slots: {
        default: () => h(LiliaWorkspaceRegion, {
          id: "details",
          role: "inspector",
          surfaceBoundary: false,
          surfaceMode: "solid",
          "data-agent-id": "consumer.override",
        }),
      },
    });

    const workspace = view.container.querySelector(".lilia-workspace");
    if (!(workspace instanceof HTMLElement)) throw new Error("Missing workspace");
    const details = region(view.container, "details");

    expect(workspace).toHaveAttribute("data-lilia-backdrop", "css-blur");
    expect(workspace).not.toHaveAttribute("data-lilia-surface-boundary");
    expect(details).toHaveAttribute("data-lilia-surface-mode", "solid");
    expect(details).toHaveAttribute("data-lilia-backdrop", "none");
    expect(details).not.toHaveAttribute("data-lilia-surface-boundary");
    expect(details).toHaveAttribute("data-agent-id", "workspace.region.details");
  });

  it("renders a single primary region without an empty navigation track", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => h(LiliaPrimaryContent, { id: "primary" }, () => "Editor"),
      },
    });
    await nextTick();

    const workspace = view.container.querySelector(".lilia-workspace");
    if (!(workspace instanceof HTMLElement)) throw new Error("Missing workspace");
    expect(workspace).toHaveAttribute("data-lilia-surface-mode", "solid");
    expect(workspace).toHaveAttribute("data-lilia-backdrop", "none");
    expect(workspace).toHaveAttribute("data-lilia-surface-level", "base");
    expect(workspace).toHaveAttribute("data-lilia-surface-boundary");
    expect(workspace.style.gridTemplateColumns).toBe("minmax(320px, 1fr)");
    expect(view.queryByRole("navigation")).not.toBeInTheDocument();
    expect(region(view.container, "primary")).toHaveAttribute("data-edge-start", "true");
    expect(region(view.container, "primary")).toHaveAttribute("data-edge-end", "true");
    expect(region(view.container, "primary")).not.toHaveAttribute("data-region-separator");
    expect(region(view.container, "primary")).toHaveAttribute("data-lilia-surface-mode", "solid");
    expect(region(view.container, "primary")).toHaveAttribute("data-lilia-backdrop", "none");
    expect(region(view.container, "primary")).toHaveAttribute("data-lilia-surface-boundary");
  });

  it("keeps primary corners when start regions and toolbars are attached", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaSectionNavigation, { id: "sections" }, () => "Nav"),
          h(LiliaWorkspaceRegion, {
            id: "editor-tools",
            role: "utility",
            placement: "top",
            scope: "primary",
          }, () => "Toolbar"),
          h(LiliaPrimaryContent, { id: "primary" }, () => "Editor"),
          h(LiliaBottomPanel, { id: "console", role: "console" }, () => "Console"),
          h(LiliaInspector, { id: "inspector" }, () => "Inspector"),
        ],
      },
    });
    await nextTick();

    const primary = region(view.container, "primary");
    expect(region(view.container, "sections")).toHaveAttribute("data-edge-start", "true");
    expect(primary).not.toHaveAttribute("data-edge-start");
    expect(primary).not.toHaveAttribute("data-edge-end");
    expect(primary).not.toHaveAttribute("data-edge-top");
    expect(primary).not.toHaveAttribute("data-edge-bottom");
    expect(region(view.container, "editor-tools")).toHaveAttribute("data-edge-top", "true");
    expect(region(view.container, "console")).toHaveAttribute("data-edge-bottom", "true");
  });

  it("recomputes attached edges and separators after independently hiding regions", async () => {
    const Fixture = defineComponent({
      setup() {
        const firstHidden = ref(false);
        const inspectorHidden = ref(false);
        const inserted = ref(false);
        return { firstHidden, inspectorHidden, inserted };
      },
      components: { LiliaWorkspace, LiliaWorkspaceRegion, LiliaPrimaryContent },
      template: `
        <LiliaWorkspace aria-label="Dynamic workspace">
          <LiliaWorkspaceRegion v-if="inserted" id="inserted" role="global-navigation" placement="start" />
          <LiliaWorkspaceRegion id="start-one" role="resources" placement="start" :hidden="firstHidden" />
          <LiliaWorkspaceRegion id="start-two" role="section-navigation" placement="start" />
          <LiliaPrimaryContent id="primary">
            <button @click="firstHidden = !firstHidden">toggle start</button>
            <button @click="inspectorHidden = !inspectorHidden">toggle inspector</button>
            <button @click="inserted = !inserted">toggle inserted region</button>
          </LiliaPrimaryContent>
          <LiliaWorkspaceRegion id="inspector" role="inspector" placement="end" :hidden="inspectorHidden" />
        </LiliaWorkspace>
      `,
    });
    const view = render(Fixture);
    await nextTick();

    expect(region(view.container, "start-one")).toHaveAttribute("data-edge-start", "true");
    expect(region(view.container, "start-two")).toHaveAttribute("data-region-separator", "inline");
    expect(region(view.container, "inspector")).toHaveAttribute("data-edge-end", "true");

    await fireEvent.click(view.getByRole("button", { name: "toggle inserted region" }));
    await waitFor(() => {
      expect(region(view.container, "inserted")).toHaveAttribute("data-edge-start", "true");
      expect(region(view.container, "start-one")).toHaveAttribute("data-region-separator", "inline");
    });

    await fireEvent.click(view.getByRole("button", { name: "toggle inserted region" }));
    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="inserted"]')).toBeNull();
      expect(region(view.container, "start-one")).toHaveAttribute("data-edge-start", "true");
      expect(region(view.container, "start-one")).not.toHaveAttribute("data-region-separator");
    });

    await fireEvent.click(view.getByRole("button", { name: "toggle start" }));
    await nextTick();
    expect(region(view.container, "start-one")).toHaveAttribute("hidden");
    expect(region(view.container, "start-two")).toHaveAttribute("data-edge-start", "true");
    expect(region(view.container, "start-two")).not.toHaveAttribute("data-region-separator");

    await fireEvent.click(view.getByRole("button", { name: "toggle inspector" }));
    await nextTick();
    expect(region(view.container, "inspector")).toHaveAttribute("hidden");
    expect(region(view.container, "primary")).toHaveAttribute("data-edge-end", "true");
  });

  it("supports multiple start and end regions with independent controlled collapse and keyboard resize", async () => {
    const Fixture = defineComponent({
      setup() {
        const resourcesCollapsed = ref(false);
        const inspectorCollapsed = ref(false);
        const resourceSize = ref(240);
        return { inspectorCollapsed, resourceSize, resourcesCollapsed };
      },
      components: {
        LiliaInspector,
        LiliaPrimaryContent,
        LiliaResourcePanel,
        LiliaSectionNavigation,
        LiliaWorkspace,
        LiliaWorkspaceRegion,
      },
      template: `
        <LiliaWorkspace>
          <LiliaSectionNavigation id="sections" />
          <LiliaResourcePanel
            id="resources"
            v-model:collapsed="resourcesCollapsed"
            v-model:size="resourceSize"
            collapsible
            resizable
          />
          <LiliaPrimaryContent id="primary">
            <button @click="resourcesCollapsed = !resourcesCollapsed">resources</button>
            <button @click="inspectorCollapsed = !inspectorCollapsed">inspector</button>
          </LiliaPrimaryContent>
          <LiliaInspector id="inspector" v-model:collapsed="inspectorCollapsed" collapsible resizable />
          <LiliaWorkspaceRegion id="tools" role="utility" placement="end" :default-size="180" />
        </LiliaWorkspace>
      `,
    });
    const view = render(Fixture);
    await nextTick();
    await nextTick();
    const resources = region(view.container, "resources");
    const handle = view.container.querySelector('[data-agent-id="workspace.region.resources.resize"]');
    if (!(handle instanceof HTMLElement)) throw new Error("Missing resource resize handle");

    expect(resources).toHaveAttribute("data-region-placement", "start");
    expect(handle).toHaveAttribute("role", "separator");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "240");

    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    await nextTick();
    expect(handle).toHaveAttribute("aria-valuenow", "248");

    await fireEvent.pointerDown(handle, { button: 0, clientX: 100, pointerId: 7 });
    await fireEvent.pointerMove(window, { clientX: 120, pointerId: 7 });
    await fireEvent.pointerUp(window, { pointerId: 7 });
    await nextTick();
    expect(handle).toHaveAttribute("aria-valuenow", "268");

    await fireEvent.click(view.getByRole("button", { name: "resources" }));
    await nextTick();
    expect(resources).toHaveAttribute("data-region-collapsed", "true");
    expect(resources).not.toHaveAttribute("hidden");
    expect(region(view.container, "sections")).toHaveAttribute("data-edge-start", "true");

    await fireEvent.click(view.getByRole("button", { name: "inspector" }));
    await nextTick();
    expect(region(view.container, "inspector")).toHaveAttribute("data-region-collapsed", "true");
    expect(region(view.container, "inspector")).not.toHaveAttribute("hidden");
    expect(region(view.container, "tools")).toHaveAttribute("data-edge-end", "true");

    await fireEvent.click(view.getByRole("button", { name: "inspector" }));
    const inspectorHandle = view.container.querySelector('[data-agent-id="workspace.region.inspector.resize"]');
    if (!(inspectorHandle instanceof HTMLElement)) throw new Error("Missing inspector resize handle");
    expect(inspectorHandle).toHaveAttribute("aria-valuenow", "280");
    await fireEvent.keyDown(inspectorHandle, { key: "ArrowLeft" });
    await nextTick();
    expect(inspectorHandle).toHaveAttribute("aria-valuenow", "288");
    expect(handle).toHaveAttribute("aria-valuenow", "268");
  });

  it("keeps a disabled resize handle truthful and non-interactive", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaWorkspaceRegion, {
            id: "disabled-tools",
            role: "utility",
            placement: "end",
            defaultSize: 180,
            resizable: true,
            disabled: true,
          }),
          h(LiliaWorkspaceRegion, {
            id: "auto-toolbar",
            role: "utility",
            placement: "top",
            resizable: true,
          }),
        ],
      },
    });
    const handle = view.container.querySelector('[data-agent-id="workspace.region.disabled-tools.resize"]');
    if (!(handle instanceof HTMLElement)) throw new Error("Missing disabled resize handle");

    expect(handle).toHaveAttribute("aria-disabled", "true");
    expect(handle).toHaveAttribute("tabindex", "-1");
    expect(handle).toHaveAttribute("aria-valuenow", "180");
    expect(view.container.querySelector('[data-agent-id="workspace.region.auto-toolbar.resize"]')).toBeNull();

    await fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "180");
  });

  it("provides bounded pointer, keyboard, reset, event, and separator accessibility behavior", async () => {
    const onResizeStart = vi.fn();
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    const onUpdateSize = vi.fn();
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaWorkspaceRegion, {
            id: "start-tools",
            role: "resources",
            placement: "start",
            defaultSize: 200,
            minSize: 100,
            maxSize: 300,
            resizeStep: 10,
            resizeLabel: "Resize resources",
            resizable: true,
            onResizeStart,
            onResize,
            onResizeEnd,
            "onUpdate:size": onUpdateSize,
          }),
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaWorkspaceRegion, {
            id: "end-tools",
            role: "inspector",
            placement: "end",
            defaultSize: 180,
            minSize: 120,
            maxSize: 240,
            resizeStep: 10,
            resizable: true,
          }),
        ],
      },
    });
    const startHandle = view.container.querySelector('[data-agent-id="workspace.region.start-tools.resize"]');
    const endHandle = view.container.querySelector('[data-agent-id="workspace.region.end-tools.resize"]');
    if (!(startHandle instanceof HTMLElement) || !(endHandle instanceof HTMLElement)) {
      throw new Error("Missing resize handles");
    }

    expect(startHandle).toHaveAttribute("role", "separator");
    expect(startHandle).toHaveAttribute("tabindex", "0");
    expect(startHandle).toHaveAttribute("aria-label", "Resize resources");
    expect(startHandle).toHaveAttribute("aria-orientation", "vertical");
    expect(startHandle).toHaveAttribute("aria-valuemin", "100");
    expect(startHandle).toHaveAttribute("aria-valuemax", "300");
    expect(startHandle).toHaveAttribute("aria-valuenow", "200");
    expect(startHandle).not.toHaveAttribute("aria-disabled");

    await fireEvent.keyDown(startHandle, { key: "ArrowLeft" });
    expect(startHandle).toHaveAttribute("aria-valuenow", "190");
    await fireEvent.keyDown(startHandle, { key: "ArrowRight" });
    expect(startHandle).toHaveAttribute("aria-valuenow", "200");
    await fireEvent.keyDown(startHandle, { key: "ArrowRight", shiftKey: true });
    expect(startHandle).toHaveAttribute("aria-valuenow", "230");
    await fireEvent.keyDown(startHandle, { key: "Home" });
    expect(startHandle).toHaveAttribute("aria-valuenow", "100");
    await fireEvent.keyDown(startHandle, { key: "End" });
    expect(startHandle).toHaveAttribute("aria-valuenow", "300");
    await fireEvent.dblClick(startHandle);
    expect(startHandle).toHaveAttribute("aria-valuenow", "200");

    onResizeStart.mockClear();
    onResize.mockClear();
    onResizeEnd.mockClear();
    onUpdateSize.mockClear();
    await fireEvent.pointerDown(startHandle, { button: 0, clientX: 200, pointerId: 17 });
    await fireEvent.pointerMove(window, { clientX: 1000, pointerId: 17 });
    await fireEvent.pointerUp(window, { pointerId: 17 });
    expect(startHandle).toHaveAttribute("aria-valuenow", "300");
    expect(onResizeStart).toHaveBeenCalledWith(200);
    expect(onResize).toHaveBeenLastCalledWith(300);
    expect(onResizeEnd).toHaveBeenLastCalledWith(300);
    expect(onUpdateSize).toHaveBeenLastCalledWith(300);

    await fireEvent.pointerDown(startHandle, { button: 0, clientX: 1000, pointerId: 18 });
    await fireEvent.pointerMove(window, { clientX: -1000, pointerId: 18 });
    await fireEvent.pointerUp(window, { pointerId: 18 });
    expect(startHandle).toHaveAttribute("aria-valuenow", "100");
    expect(onResize).toHaveBeenLastCalledWith(100);
    expect(onResizeEnd).toHaveBeenLastCalledWith(100);
    expect(onUpdateSize).toHaveBeenLastCalledWith(100);

    await fireEvent.keyDown(endHandle, { key: "ArrowLeft" });
    expect(endHandle).toHaveAttribute("aria-valuenow", "190");
    await fireEvent.keyDown(endHandle, { key: "ArrowRight", shiftKey: true });
    expect(endHandle).toHaveAttribute("aria-valuenow", "160");
  });

  it("preserves explicit false boolean props through Region presets", async () => {
    const Fixture = defineComponent({
      setup() {
        const collapsed = ref(false);
        return { collapsed };
      },
      components: { LiliaPrimaryContent, LiliaResourcePanel, LiliaWorkspace },
      template: `
        <LiliaWorkspace>
          <LiliaResourcePanel
            id="resources"
            :collapsed="collapsed"
            :disabled="false"
            :hidden="false"
            collapsible
            resizable
          />
          <LiliaPrimaryContent id="primary">
            <button @click="collapsed = !collapsed">toggle</button>
          </LiliaPrimaryContent>
        </LiliaWorkspace>
      `,
    });
    const view = render(Fixture);
    const resources = region(view.container, "resources");

    await waitFor(() => {
      expect(resources).not.toHaveAttribute("hidden");
      expect(view.container.querySelector('[data-agent-id="workspace.region.resources.resize"]'))
        .toBeInstanceOf(HTMLElement);
    });

    await fireEvent.click(view.getByRole("button", { name: "toggle" }));
    await nextTick();
    expect(resources).toHaveAttribute("data-region-collapsed", "true");
    expect(resources).not.toHaveAttribute("hidden");
  });

  it("supports bounded fixed tracks, weighted fill tracks, and explicit overflow", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaWorkspaceRegion, {
            id: "bounded",
            role: "resources",
            placement: "start",
            defaultSize: 999,
            minSize: 120,
            maxSize: 300,
            overflow: "hidden",
          }),
          h(LiliaPrimaryContent, { id: "primary", fillPriority: 3 }),
          h(LiliaWorkspaceRegion, {
            id: "flexible",
            role: "utility",
            placement: "end",
            minSize: 100,
            fillPriority: 2,
          }),
        ],
      },
    });
    await nextTick();

    const workspace = view.container.querySelector(".lilia-workspace");
    if (!(workspace instanceof HTMLElement)) throw new Error("Missing workspace");
    expect(workspace.style.gridTemplateColumns).toBe(
      "minmax(120px, 300px) minmax(320px, 3fr) minmax(100px, 2fr)",
    );
    expect(region(view.container, "bounded").style.getPropertyValue("--lilia-region-overflow")).toBe("hidden");
    expect(view.container.querySelector('[data-agent-id="workspace.region.flexible.resize"]')).toBeNull();
  });

  it("keeps uncontrolled collapse local and prevents disabled regions from changing state", async () => {
    const Fixture = defineComponent({
      setup() {
        const uncontrolled = ref<{ toggleCollapsed: () => void } | null>(null);
        const disabled = ref<{ toggleCollapsed: () => void } | null>(null);
        return {
          disabled,
          toggleDisabled: () => disabled.value?.toggleCollapsed(),
          toggleUncontrolled: () => uncontrolled.value?.toggleCollapsed(),
          uncontrolled,
        };
      },
      components: { LiliaPrimaryContent, LiliaWorkspace, LiliaWorkspaceRegion },
      template: `
        <LiliaWorkspace>
          <LiliaWorkspaceRegion
            id="uncontrolled"
            ref="uncontrolled"
            role="resources"
            placement="start"
            collapsible
          />
          <LiliaPrimaryContent id="primary">
            <button @click="toggleUncontrolled">toggle uncontrolled</button>
            <button @click="toggleDisabled">toggle disabled</button>
          </LiliaPrimaryContent>
          <LiliaWorkspaceRegion
            id="disabled"
            ref="disabled"
            role="utility"
            placement="end"
            collapsible
            disabled
          />
        </LiliaWorkspace>
      `,
    });
    const view = render(Fixture);
    await nextTick();

    expect(region(view.container, "uncontrolled")).not.toHaveAttribute("hidden");
    await fireEvent.click(view.getByRole("button", { name: "toggle uncontrolled" }));
    await nextTick();
    expect(region(view.container, "uncontrolled")).toHaveAttribute("data-region-collapsed", "true");
    expect(region(view.container, "uncontrolled")).not.toHaveAttribute("hidden");

    expect(region(view.container, "disabled")).not.toHaveAttribute("hidden");
    await fireEvent.click(view.getByRole("button", { name: "toggle disabled" }));
    await nextTick();
    expect(region(view.container, "disabled")).not.toHaveAttribute("hidden");
  });

  it("distinguishes workspace-wide and primary-scoped top and bottom regions", async () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaWorkspaceRegion, { id: "command", role: "utility", placement: "top", scope: "workspace" }),
          h(LiliaResourcePanel, { id: "resources" }),
          h(LiliaWorkspaceRegion, { id: "editor-tools", role: "utility", placement: "top", scope: "primary" }),
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaBottomPanel, { id: "timeline", role: "timeline" }),
          h(LiliaWorkspaceRegion, { id: "status", role: "utility", placement: "bottom", scope: "workspace" }),
        ],
      },
    });
    await nextTick();

    expect(region(view.container, "command").style.gridColumn).toBe("1 / -1");
    expect(region(view.container, "status").style.gridColumn).toBe("1 / -1");
    expect(region(view.container, "editor-tools").style.gridColumn).toBe("2 / 3");
    expect(region(view.container, "timeline").style.gridColumn).toBe("2 / 3");
    expect(region(view.container, "timeline")).toHaveAttribute("data-region-role", "timeline");
  });

  it("keeps all semantic presets on the same region layout path", () => {
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaGlobalNavigation, { id: "global" }),
          h(LiliaSectionNavigation, { id: "section" }),
          h(LiliaResourcePanel, { id: "resources" }),
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaInspector, { id: "inspector" }),
          h(LiliaBottomPanel, { id: "bottom" }),
        ],
      },
    });

    for (const id of ["global", "section", "resources", "primary", "inspector", "bottom"]) {
      expect(region(view.container, id)).toHaveClass("lilia-workspace-region");
    }
    expect(region(view.container, "global").tagName).toBe("NAV");
    expect(region(view.container, "primary").tagName).toBe("MAIN");
    expect(region(view.container, "inspector").tagName).toBe("ASIDE");
  });

  it("applies explicit narrow-window collapse and overlay policies without changing the primary track", async () => {
    let workspaceWidth = 700;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      if (this.classList.contains("lilia-workspace")) return new DOMRect(0, 0, workspaceWidth, 500);
      return new DOMRect(0, 0, 200, 500);
    });
    const view = render(LiliaWorkspace, {
      slots: {
        default: () => [
          h(LiliaSectionNavigation, { id: "section" }),
          h(LiliaResourcePanel, { id: "resources" }),
          h(LiliaWorkspaceRegion, {
            id: "auto-priority",
            role: "utility",
            placement: "end",
            narrowBehavior: "collapse",
            responsivePriority: 1,
          }),
          h(LiliaPrimaryContent, { id: "primary" }),
          h(LiliaInspector, { id: "inspector" }),
        ],
      },
    });

    await waitFor(() => {
      expect(region(view.container, "section")).toHaveAttribute("hidden");
      expect(region(view.container, "resources")).toHaveAttribute("data-region-overlay", "true");
      expect(region(view.container, "inspector")).toHaveAttribute("hidden");
      expect(region(view.container, "auto-priority")).toHaveAttribute("hidden");
      expect(region(view.container, "primary")).not.toHaveAttribute("hidden");
    });

    workspaceWidth = 1100;
    window.dispatchEvent(new Event("resize"));
    await waitFor(() => {
      expect(region(view.container, "section")).not.toHaveAttribute("hidden");
      expect(region(view.container, "resources")).not.toHaveAttribute("data-region-overlay");
      expect(region(view.container, "inspector")).not.toHaveAttribute("hidden");
      expect(region(view.container, "auto-priority")).not.toHaveAttribute("hidden");
    });
  });
});

describe("Workspace region geometry", () => {
  it("does not measure region rects when no geometry consumer subscribed", async () => {
    let regionReads = 0;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      if (this.dataset.regionId) regionReads += 1;
      return this.classList.contains("lilia-workspace")
        ? new DOMRect(0, 0, 700, 800)
        : new DOMRect(0, 0, 120, 80);
    });
    const Host = defineComponent({
      setup() {
        const revision = ref(0);
        return { revision };
      },
      components: { LiliaResourcePanel, LiliaWorkspace, LiliaWorkspaceRegion },
      template: `
        <LiliaWorkspace>
          <LiliaResourcePanel id="responsive-overlay" />
          <LiliaWorkspaceRegion
            v-for="index in 20"
            :key="index"
            :id="'region-' + index"
            :role="index === 10 ? 'primary' : 'utility'"
            :placement="index === 10 ? 'primary' : index % 2 ? 'start' : 'end'"
          >{{ revision }}</LiliaWorkspaceRegion>
          <button @click="revision += 1">update</button>
        </LiliaWorkspace>
      `,
    });
    const view = render(Host);
    await waitFor(() => expect(region(view.container, "region-10")).toBeVisible());
    expect(regionReads).toBe(0);
    await fireEvent.click(view.getByRole("button", { name: "update" }));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(regionReads).toBe(0);
  });

  it("reports responsive overlay occlusion and releases overlay observation on collapse and unsubscribe", async () => {
    let workspaceWidth = 700;
    const observed = new Set<Element>();
    const observe = vi.fn((element: Element) => observed.add(element));
    const unobserve = vi.fn((element: Element) => observed.delete(element));
    vi.stubGlobal("ResizeObserver", vi.fn(class {
      observe = observe;
      unobserve = unobserve;
      disconnect = vi.fn(() => observed.clear());
    }));
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      if (this.classList.contains("lilia-workspace")) return new DOMRect(0, 0, workspaceWidth, 600);
      if (this.dataset.regionId === "resources") return new DOMRect(0, 0, 260, 600);
      if (this.dataset.regionId === "primary") {
        return workspaceWidth < 860
          ? new DOMRect(0, 0, workspaceWidth, 600)
          : new DOMRect(260, 0, workspaceWidth - 260, 600);
      }
      return new DOMRect();
    });

    const GeometryProbe = defineComponent({
      setup() { return { geometry: useWorkspaceRegion("primary") }; },
      template: `<output data-testid="overlay-geometry">{{ geometry.stable.value }}|{{ geometry.overlayOccluded.value }}</output>`,
    });
    const Host = defineComponent({
      setup() {
        const primaryHidden = ref(false);
        const resourcesCollapsed = ref(false);
        const subscribed = ref(true);
        return { primaryHidden, resourcesCollapsed, subscribed };
      },
      components: { GeometryProbe, LiliaPrimaryContent, LiliaResourcePanel, LiliaWorkspace },
      template: `
        <div>
          <button @click="primaryHidden = !primaryHidden">primary</button>
          <LiliaWorkspace>
            <LiliaResourcePanel
              id="resources"
              v-model:collapsed="resourcesCollapsed"
              collapsible
            />
            <LiliaPrimaryContent id="primary" :hidden="primaryHidden">
              <GeometryProbe v-if="subscribed" />
              <button @click="resourcesCollapsed = !resourcesCollapsed">resources</button>
              <button @click="subscribed = false">unsubscribe</button>
            </LiliaPrimaryContent>
          </LiliaWorkspace>
        </div>
      `,
    });
    const view = render(Host);
    const resources = region(view.container, "resources");
    const primary = region(view.container, "primary");

    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|true");
      expect(observed).toContain(resources);
      expect(observed).toContain(primary);
    });

    await fireEvent.click(view.getByRole("button", { name: "resources" }));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|false");
      expect(unobserve).toHaveBeenCalledWith(resources);
      expect(observed).not.toContain(resources);
    });

    await fireEvent.click(view.getByRole("button", { name: "resources" }));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|true");
      expect(observed).toContain(resources);
    });

    await fireEvent.click(view.getByRole("button", { name: "primary" }));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|false");
      expect(observed).not.toContain(resources);
      expect(observed).not.toContain(primary);
    });
    await fireEvent.click(view.getByRole("button", { name: "primary" }));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|true");
      expect(observed).toContain(resources);
      expect(observed).toContain(primary);
    });

    workspaceWidth = 1100;
    window.dispatchEvent(new Event("resize"));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|false");
      expect(observed).not.toContain(resources);
    });

    workspaceWidth = 700;
    window.dispatchEvent(new Event("resize"));
    await waitFor(() => {
      expect(view.getByTestId("overlay-geometry")).toHaveTextContent("true|true");
      expect(observed).toContain(resources);
    });
    await fireEvent.click(view.getByRole("button", { name: "unsubscribe" }));
    await waitFor(() => {
      expect(view.queryByTestId("overlay-geometry")).not.toBeInTheDocument();
      expect(observed).not.toContain(resources);
      expect(observed).not.toContain(primary);
    });
  });

  it("measures only subscribed regions and coalesces refreshes in one frame", async () => {
    const observed = new Set<Element>();
    const observe = vi.fn((element: Element) => observed.add(element));
    const unobserve = vi.fn((element: Element) => observed.delete(element));
    vi.stubGlobal("ResizeObserver", vi.fn(class {
      observe = observe;
      unobserve = unobserve;
      disconnect = vi.fn(() => observed.clear());
    }));
    const reads = new Map<string, number>();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      const id = this.dataset.regionId ?? "workspace";
      reads.set(id, (reads.get(id) ?? 0) + 1);
      return new DOMRect(0, 0, id === "workspace" ? 900 : 300, 600);
    });
    const Probe = defineComponent({
      setup() { return { geometry: useWorkspaceRegion("subscribed") }; },
      template: `<output>{{ geometry.stable.value }}</output>`,
    });
    const Host = defineComponent({
      components: { LiliaWorkspace, LiliaWorkspaceRegion, Probe },
      template: `
        <LiliaWorkspace>
          <LiliaWorkspaceRegion id="plain" role="resources" placement="start" />
          <LiliaWorkspaceRegion id="subscribed" role="primary"><Probe /></LiliaWorkspaceRegion>
          <LiliaWorkspaceRegion id="plain-end" role="inspector" placement="end" />
        </LiliaWorkspace>
      `,
    });
    const view = render(Host);
    await waitFor(() => expect(view.getByText("true")).toBeInTheDocument());
    expect(reads.get("plain") ?? 0).toBe(0);
    expect(reads.get("plain-end") ?? 0).toBe(0);
    expect(observe).toHaveBeenCalledTimes(2);

    reads.set("subscribed", 0);
    for (let index = 0; index < 8; index += 1) window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(reads.get("subscribed")).toBe(1);
  });

  it("publishes the latest clipped primary rect after region resize, viewport scale, and visibility changes", async () => {
    let primaryWidth = 640;
    const visualViewport = new EventTarget() as VisualViewport;
    vi.stubGlobal("visualViewport", visualViewport);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      if (this.classList.contains("lilia-workspace")) return new DOMRect(10, 20, 800, 600);
      if (this.dataset.regionId === "primary") return new DOMRect(100, 40, primaryWidth, 700);
      return new DOMRect();
    });

    const GeometryProbe = defineComponent({
      setup() {
        const geometry = useWorkspaceRegion("primary");
        return { geometry };
      },
      template: `
        <output data-testid="geometry">
          {{ geometry.visible.value }}|{{ geometry.stable.value }}|{{ geometry.rect.value?.width ?? 0 }}|{{ geometry.safeRect.value?.height ?? 0 }}
        </output>
      `,
    });
    const Host = defineComponent({
      setup() {
        const hidden = ref(false);
        return { hidden };
      },
      components: { GeometryProbe, LiliaPrimaryContent, LiliaResourcePanel, LiliaWorkspace },
      template: `
        <LiliaWorkspace>
          <LiliaResourcePanel id="resources" :default-size="220" resizable />
          <LiliaPrimaryContent id="primary" :hidden="hidden">
            <GeometryProbe />
            <button @click="hidden = !hidden">visibility</button>
          </LiliaPrimaryContent>
        </LiliaWorkspace>
      `,
    });
    const view = render(Host);

    await waitFor(() => {
      expect(view.getByTestId("geometry")).toHaveTextContent("true|true|640|580");
    });

    primaryWidth = 520;
    const resizeHandle = view.container.querySelector('[data-agent-id="workspace.region.resources.resize"]');
    if (!(resizeHandle instanceof HTMLElement)) throw new Error("Missing resource resize handle");
    await fireEvent.keyDown(resizeHandle, { key: "ArrowRight" });
    await waitFor(() => {
      expect(view.getByTestId("geometry")).toHaveTextContent("true|true|520|580");
    });

    primaryWidth = 500;
    visualViewport.dispatchEvent(new Event("resize"));
    await waitFor(() => {
      expect(view.getByTestId("geometry")).toHaveTextContent("true|true|500|580");
    });

    await fireEvent.click(view.getByRole("button", { name: "visibility" }));
    await waitFor(() => {
      expect(view.getByTestId("geometry")).toHaveTextContent("false|true|0|0");
    });
  });
});
