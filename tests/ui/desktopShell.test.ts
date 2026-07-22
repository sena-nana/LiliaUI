import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import { render, screen, waitFor } from "@testing-library/vue";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiliaDesktopShell } from "@lilia/ui/shell";
import { NanaDesktopShell } from "@lilia/nana-ui/shell";

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
  });
});

describe("NanaDesktopShell", () => {
  it("composes sidebar, main, and optional context/footer without owning a router", async () => {
    const router = await prepare();
    const view = render(NanaDesktopShell, {
      props: {
        title: "Nana Workspace",
        navigation: [{ id: "home", label: "首页", icon: Home, href: "/" }],
        settingsItem: { id: "settings", label: "设置", icon: Settings, href: "/settings" },
        contextVisible: true,
        contextTitle: "属性",
      },
      slots: {
        default: '<div data-testid="main-content">主要任务</div>',
        context: '<div data-testid="context-content">属性内容</div>',
        status: '<div data-testid="status-content">状态栏</div>',
      },
      global: { plugins: [router] },
    });

    expect(view.container.querySelector(".nana-sidebar")).not.toBeNull();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.getByTestId("context-content")).toBeInTheDocument();
    expect(screen.getByTestId("status-content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设置" })).toBeInTheDocument();
    const context = view.container.querySelector(".nana-desktop-shell__context");
    expect(context).toHaveAttribute("aria-label", "属性");
  });

  it("emits update:sidebarMode when the sidebar toggle is activated", async () => {
    const router = await prepare();
    const view = render(NanaDesktopShell, {
      props: {
        title: "Nana",
        navigation: [{ id: "home", label: "首页", icon: Home, href: "/" }],
      },
      slots: { default: '<div>主要</div>' },
      global: { plugins: [router] },
    });
    const toggle = screen.getByRole("button", { name: "收起侧边栏" });
    await toggle.click();
    expect(view.emitted("update:sidebarMode")?.[0]).toEqual(["icon"]);
  });

  it("omits the sidebar when no navigation or sidebar slots are provided", async () => {
    const router = await prepare();
    const view = render(defineComponent({
      components: { NanaDesktopShell },
      template: '<NanaDesktopShell title="Nana"><div data-testid="main-content">主要</div></NanaDesktopShell>',
    }), { global: { plugins: [router] } });

    expect(view.container.querySelector(".nana-sidebar")).toBeNull();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
  });
});
