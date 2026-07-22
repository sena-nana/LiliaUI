import { cleanup, fireEvent, render } from "@testing-library/vue";
import { computed, defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, it } from "vitest";
import { LiliaUIProvider, useLiliaUI } from "@lilia/ui/provider";
import { LiliaAppShell } from "@lilia/ui/shell";
import { LiliaSettingsPage } from "@lilia/ui/settings";
import { createSettingsModel, settingsKey } from "@lilia/ui-foundation/settings";

afterEach(cleanup);

describe("Lilia framework layer", () => {
  it("mounts its shell without a Router and renders the common slots", () => {
    const view = render(LiliaAppShell, {
      props: { title: "Workspace", agentId: "framework.shell" },
      slots: {
        "header-leading": "Leading",
        "header-center": "Center",
        "header-actions": "Actions",
        default: "Application content",
        overlays: "Application overlay",
      },
    });

    expect(view.getByText("Leading")).toBeVisible();
    expect(view.getByText("Center")).toBeVisible();
    expect(view.getByText("Actions")).toBeVisible();
    expect(view.getByText("Application content")).toBeVisible();
    expect(view.getByText("Application overlay")).toBeVisible();
    expect(view.container.querySelector("[data-agent-id='framework.shell']")).not.toBeNull();
  });

  it("uses the shared policy context with layer defaults and reset behavior", async () => {
    const PolicyControl = defineComponent({
      setup() {
        const context = useLiliaUI();
        const currentDensity = computed(() => context.policy.value.density);
        return () => h("button", {
          onClick: () => context.setPolicy({ density: "comfortable" }),
          onDblclick: () => context.resetPolicy(),
        }, currentDensity.value);
      },
    });
    const view = render(LiliaUIProvider, { slots: { default: () => h(PolicyControl) } });
    const root = view.container.querySelector(".lilia-ui");
    expect(root).toHaveAttribute("data-density", "compact");
    const button = view.getByRole("button");
    await fireEvent.click(button);
    expect(root).toHaveAttribute("data-density", "comfortable");
    await fireEvent.dblClick(button);
    expect(root).toHaveAttribute("data-density", "compact");
  });

  it("resolves standard and full-page settings through the same Foundation model", async () => {
    const Standard = defineComponent({ props: { value: String }, template: "<div>Standard {{ value }}</div>" });
    const FullPage = defineComponent({ props: { value: String }, template: "<article>Full {{ value }}</article>" });
    const Icon = defineComponent({ template: "<span />" });
    const model = createSettingsModel({
      defaultTab: "standard",
      description: "Shared settings",
      fullPageTabs: ["full"],
      path: "/settings",
      sections: { standard: Standard, full: FullPage },
      tabs: [
        { key: "standard", label: "Standard", icon: Icon, props: { value: "section" } },
        { key: "full", label: "Full", icon: Icon, props: { value: "page" } },
      ],
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/settings", component: LiliaSettingsPage }],
    });
    await router.push("/settings");
    await router.isReady();
    const view = render(LiliaSettingsPage, {
      global: { plugins: [router], provide: { [settingsKey as symbol]: model } },
    });
    expect(view.getByText("Standard section")).toBeVisible();
    expect(view.getByText("Shared settings")).toBeVisible();

    await router.push("/settings?tab=full");
    expect(await view.findByText("Full page")).toBeVisible();
    expect(view.queryByText("Shared settings")).toBeNull();
  });
});
