import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import { render, screen, waitFor } from "@testing-library/vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiliaDesktopShell } from "@lilia/ui/shell";

function routerPlugin() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/settings", component: { template: "<div />" } },
    ],
  });
}

async function prepare(router = routerPlugin()) {
  await router.push("/");
  await router.isReady();
  return router;
}

afterEach(() => vi.useRealTimers());

describe("LiliaDesktopShell", () => {
  it("composes navigation, primary, and footer regions without owning a router", async () => {
    const router = await prepare();
    const view = render(LiliaDesktopShell, {
      props: {
        title: "Lilia Workspace",
        navigation: [
          { key: "home", label: "首页", icon: Home, to: "/" },
          { key: "inbox", label: "收集箱", icon: Home, to: "/inbox" },
        ],
        footerLinks: [{ key: "settings", label: "设置", icon: Settings, to: "/settings" }],
        footerStatuses: [{ key: "sync", label: "已同步", icon: Settings, title: "同步状态", to: "/sync", tone: "ok" as const }],
      },
      slots: { default: '<div data-testid="primary-content">主要</div>' },
      global: { plugins: [router] },
    });

    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="navigation"]')).not.toHaveAttribute("hidden");
    });
    const nav = view.container.querySelector('[data-region-id="navigation"]');
    expect(nav).toHaveAttribute("data-region-role", "section-navigation");
    expect(nav).toHaveAttribute("data-region-placement", "start");

    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="primary"]')).not.toHaveAttribute("hidden");
    });
    expect(view.container.querySelector('[data-region-id="primary"]')).toHaveAttribute("data-region-role", "primary");

    expect(screen.getByTestId("primary-content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByText("已同步")).toBeInTheDocument();
  });

  it("renders optional bottom and inspector slots as workspace regions", async () => {
    const router = await prepare();
    const view = render(LiliaDesktopShell, {
      props: { title: "Lilia" },
      slots: {
        default: '<div data-testid="primary-content">主要</div>',
        bottom: '<div data-testid="bottom-content">控制台</div>',
        inspector: '<div data-testid="inspector-content">检查器</div>',
      },
      global: { plugins: [router] },
    });

    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="primary-bottom"]')).not.toHaveAttribute("hidden");
      expect(view.container.querySelector('[data-region-id="primary-inspector"]')).not.toHaveAttribute("hidden");
    });
    expect(screen.getByTestId("bottom-content")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-content")).toBeInTheDocument();
  });

  it("omits the navigation region when no navigation content is provided", async () => {
    const router = await prepare();
    const view = render(LiliaDesktopShell, {
      props: { title: "Lilia" },
      slots: { default: '<div>主要</div>' },
      global: { plugins: [router] },
    });

    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="primary"]')).not.toHaveAttribute("hidden");
    });
    expect(view.container.querySelector('[data-region-id="navigation"]')).toBeNull();
  });

  it("forwards header slots to the window shell", async () => {
    const router = await prepare();
    render(LiliaDesktopShell, {
      props: { title: "Lilia" },
      slots: {
        default: '<div>主要</div>',
        "header-leading": '<button aria-label="命令">命令</button>',
        "header-center": "标题",
        "header-actions": '<button aria-label="保存">保存</button>',
      },
      global: { plugins: [router] },
    });

    expect(screen.getByRole("button", { name: "命令" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByText("标题")).toBeInTheDocument();
  });

  it("wires workspace sidebar/main surfaces from backdropMode and backdropTarget", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    localStorage.setItem("lilia-ui-test.backdropMode", "mica");
    localStorage.setItem("lilia-ui-test.backdropTarget", "sidebar");
    vi.resetModules();

    const { setLiliaUiConfig } = await import("@lilia/ui/shell");
    const { LiliaDesktopShell: Shell } = await import("@lilia/ui/shell");
    setLiliaUiConfig({
      appName: "lilia-ui-test",
      productTitle: "Lilia UI Test",
      storageKeyPrefix: "lilia-ui-test",
      version: "0.0.0",
    });

    const router = await prepare();
    const view = render(Shell, {
      props: {
        title: "Lilia",
        navigation: [{ key: "home", label: "首页", icon: Home, to: "/" }],
      },
      slots: { default: "<div>主要</div>" },
      global: { plugins: [router] },
    });

    await waitFor(() => {
      expect(view.container.querySelector('[data-region-id="navigation"]')).not.toHaveAttribute("hidden");
      expect(view.container.querySelector('[data-region-id="primary"]')).not.toHaveAttribute("hidden");
    });

    const workspace = view.container.querySelector(".lilia-workspace");
    const navigation = view.container.querySelector('[data-region-id="navigation"]');
    const primary = view.container.querySelector('[data-region-id="primary"]');
    if (!(workspace instanceof HTMLElement) || !(navigation instanceof HTMLElement) || !(primary instanceof HTMLElement)) {
      throw new Error("Missing desktop shell surfaces");
    }

    expect(workspace).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(workspace).toHaveAttribute("data-lilia-backdrop", "none");
    expect(navigation).toHaveAttribute("data-lilia-surface-mode", "translucent");
    expect(navigation).toHaveAttribute("data-lilia-backdrop", "none");
    expect(primary).toHaveAttribute("data-lilia-surface-mode", "solid");
    expect(primary).toHaveAttribute("data-lilia-backdrop", "none");
    const shell = view.container.querySelector(".lilia-app-shell");
    expect(shell).toHaveAttribute("data-lilia-backdrop-target", "sidebar");

    const { useNativeAppearance } = await import("@lilia/ui/composables");
    useNativeAppearance().setBackdropTarget("main");

    await waitFor(() => {
      expect(navigation).toHaveAttribute("data-lilia-surface-mode", "solid");
      expect(primary).toHaveAttribute("data-lilia-surface-mode", "translucent");
    });
    expect(primary).toHaveAttribute("data-lilia-backdrop", "none");
    expect(shell).toHaveAttribute("data-lilia-backdrop-target", "main");
    expect(view.container.querySelectorAll('[data-lilia-backdrop="native"]')).toHaveLength(1);
  });
});
