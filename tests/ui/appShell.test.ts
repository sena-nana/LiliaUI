import { fireEvent, render, waitFor } from "@testing-library/vue";
import { defineComponent, ref, type Component } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LiliaAppShell,
  LiliaDesktopShell,
  LiliaSidebarFrame,
  SIDEBAR_CONFIG,
  SIDEBAR_FOOTER_STATUSES,
  liliaShellOptionsKey,
  setLiliaUiConfig,
  type LiliaUiConfig,
  type LiliaShellOptions,
} from "@lilia/ui/shell";
import { testAppConfig } from "./fixtures/appConfig";
import { createLiliaSettingsModel, liliaSettingsKey } from "@lilia/ui/settings";

const TestSettingsIcon = defineComponent({ template: "<span />" });
const testSettings = createLiliaSettingsModel({
  defaultTab: "appearance",
  path: "/settings",
  tabs: [
    { key: "appearance", label: "外观", icon: TestSettingsIcon },
    { key: "about", label: "关于", icon: TestSettingsIcon },
  ],
  sections: {
    appearance: defineComponent({ template: "<div />" }),
    about: defineComponent({ template: "<div />" }),
  },
});

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    isMaximized: vi.fn(async () => false),
    onResized: vi.fn(async () => vi.fn()),
    minimize: vi.fn(async () => undefined),
    toggleMaximize: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  }),
}));

async function renderAppShell(
  initialRoute = "/",
  config: LiliaUiConfig = testAppConfig,
  shellOptions: LiliaShellOptions = {},
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        component: { template: "<div>home</div>" },
        meta: { sidebar: "main", returnable: true },
      },
      {
        path: "/settings",
        component: { template: "<div>settings</div>" },
        meta: { sidebar: "settings", lockSidebar: true, returnable: false },
      },
      {
        path: "/components",
        component: { template: "<div>components</div>" },
        meta: { sidebar: "main", returnable: true },
      },
      {
        path: "/workspace",
        component: { template: "<div>workspace</div>" },
        meta: { sidebar: "main", contentLayout: "workspace", returnable: true },
      },
      { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
  });
  await router.push(initialRoute);
  await router.isReady();

  setLiliaUiConfig(config);
  const view = render(LiliaDesktopShell, {
    global: {
      plugins: [router],
      provide: {
        [liliaShellOptionsKey as symbol]: shellOptions,
        [liliaSettingsKey as symbol]: testSettings,
      },
    },
  });

  return {
    ...view,
    router,
  };
}

function shellElement(container: HTMLElement): HTMLElement {
  const shell = container.querySelector(".shell");
  if (!(shell instanceof HTMLElement)) {
    throw new Error("未找到 shell");
  }
  return shell;
}

function leftResizer(container: HTMLElement): HTMLElement {
  const resizer = container.querySelector(".shell__resizer");
  if (!(resizer instanceof HTMLElement)) {
    throw new Error("未找到左侧栏拖拽线");
  }
  return resizer;
}

function agentTarget(container: HTMLElement, id: string): HTMLElement {
  const target = container.querySelector(`[data-agent-id="${id}"]`);
  if (!(target instanceof HTMLElement)) {
    throw new Error(`未找到 Agent 调试目标: ${id}`);
  }
  return target;
}

function sidebarZone(container: HTMLElement, className: string): HTMLElement {
  const zone = container.querySelector(`.${className}`);
  if (!(zone instanceof HTMLElement)) {
    throw new Error(`未找到侧边栏区域: ${className}`);
  }
  return zone;
}

function sidebarRowForText(container: HTMLElement, text: string): HTMLElement {
  const label = Array.from(container.querySelectorAll(".sb-tree__name")).find(
    (node) => node.textContent === text,
  );
  const row = label?.closest(".sb-tree__row");
  if (!(row instanceof HTMLElement)) {
    throw new Error(`未找到侧边栏行: ${text}`);
  }
  return row;
}

beforeEach(() => {
  localStorage.clear();
  setLiliaUiConfig(testAppConfig);
});

describe("AppShell sidebar", () => {
  it("壳层主路径暴露稳定 Agent 调试标识", async () => {
    const view = await renderAppShell();

    expect(agentTarget(view.container, "shell")).toHaveClass("shell");
    expect(agentTarget(view.container, "shell.sidebar.resizer")).toHaveAttribute(
      "role",
      "separator",
    );
    expect(agentTarget(view.container, "shell.main").tagName).toBe("MAIN");
    expect(agentTarget(view.container, "titlebar")).toHaveClass("titlebar");
    expect(agentTarget(view.container, "titlebar.left-sidebar.toggle")).toHaveAttribute(
      "aria-label",
      "折叠左侧栏",
    );
    expect(agentTarget(view.container, "titlebar.window.minimize")).toHaveAttribute(
      "aria-label",
      "最小化",
    );
    expect(agentTarget(view.container, "titlebar.window.maximize")).toHaveAttribute(
      "aria-label",
      "最大化",
    );
    expect(agentTarget(view.container, "titlebar.window.close")).toHaveAttribute(
      "aria-label",
      "关闭",
    );
    expect(agentTarget(view.container, "sidebar.main")).toHaveClass("secondary-panel");
    expect(agentTarget(view.container, "sidebar.nav.overview")).toHaveTextContent("首页");
    expect(agentTarget(view.container, "sidebar.footer.settings")).toHaveAttribute("href", "/settings");
    expect(agentTarget(view.container, "sidebar.footer.status")).toHaveClass("sb-conn--ok");
  });

  it("主侧边栏支持多个独立状态并保留单状态运行时入口", async () => {
    const view = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        footerStatuses: [
          {
            key: "model",
            to: "/settings?tab=model-config",
            label: "模型未配置",
            title: "配置模型",
            tone: "warn",
            icon: "brain",
          },
          {
            key: "editor",
            to: "/settings?tab=editor",
            label: "Editor 已就绪",
            title: "查看 Editor",
            tone: "ok",
            icon: "server",
          },
        ],
      },
    });

    const legacyTarget = agentTarget(view.container, "sidebar.footer.status");
    const modelTarget = agentTarget(view.container, "sidebar.footer.status.model");
    const editorTarget = agentTarget(view.container, "sidebar.footer.status.editor");

    expect(legacyTarget).toHaveAttribute("href", "/settings?tab=model-config");
    expect(modelTarget.closest("a")).toBe(legacyTarget);
    expect(editorTarget).toHaveAttribute("href", "/settings?tab=editor");
    expect(legacyTarget).toHaveClass("sb-conn--warn");
    expect(editorTarget).toHaveClass("sb-conn--ok");
    expect(SIDEBAR_FOOTER_STATUSES.map((status) => status.key)).toEqual(["model", "editor"]);
    Object.assign(SIDEBAR_FOOTER_STATUSES[0]!, { label: "模型已配置", tone: "ok" });
    await waitFor(() => {
      expect(legacyTarget).toHaveTextContent("模型已配置");
      expect(legacyTarget).toHaveClass("sb-conn--ok");
    });
  });

  it("显式空状态列表不会回退到默认侧边栏状态", async () => {
    const view = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        footerStatuses: [],
      },
    });

    expect(view.container.querySelector("[data-agent-id='sidebar.footer.status']")).toBeNull();
    expect(SIDEBAR_FOOTER_STATUSES).toHaveLength(0);
  });

  it("主侧边栏不渲染未接入的占位工具按钮", async () => {
    const view = await renderAppShell("/");

    expect(sidebarRowForText(view.container, "首页")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "新建" })).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "搜索" })).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "添加" })).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "更多" })).not.toBeInTheDocument();

    expect(view.router.currentRoute.value.fullPath).toBe("/");
  });

  it("主侧边栏支持由应用注入业务侧栏", async () => {
    const BusinessSidebar: Component = defineComponent({
      components: { LiliaSidebarFrame },
      template: `
        <LiliaSidebarFrame agent-id="business.sidebar" aria-label="业务资源">
          <template #top><button type="button">新建项目</button></template>
          <template #body><div>业务侧栏</div></template>
        </LiliaSidebarFrame>
      `,
    });
    const view = await renderAppShell("/", testAppConfig, {
      mainSidebar: BusinessSidebar,
    });

    expect(agentTarget(view.container, "business.sidebar")).toHaveTextContent("业务侧栏");
    expect(agentTarget(view.container, "business.sidebar")).toHaveAttribute("aria-label", "业务资源");
    expect(view.getByRole("button", { name: "新建项目" })).toBeInTheDocument();
    expect(agentTarget(view.container, "sidebar.footer.settings")).toHaveAttribute("href", "/settings");
    expect(view.queryByRole("navigation", { name: "主导航" })).not.toBeInTheDocument();
  });

  it("业务侧栏可替换共享 Frame 的底部区域", async () => {
    const BusinessSidebar: Component = defineComponent({
      components: { LiliaSidebarFrame },
      template: `
        <LiliaSidebarFrame agent-id="business.sidebar">
          <template #body><div>资源树</div></template>
          <template #footer><button type="button">项目状态</button></template>
        </LiliaSidebarFrame>
      `,
    });
    const view = await renderAppShell("/", testAppConfig, {
      mainSidebar: BusinessSidebar,
    });

    expect(view.getByRole("button", { name: "项目状态" })).toBeInTheDocument();
    expect(view.container.querySelector('[data-agent-id="sidebar.footer.settings"]')).not.toBeInTheDocument();
    expect(view.container.querySelector(".secondary-panel__footer")).toContainElement(
      view.getByRole("button", { name: "项目状态" }),
    );
  });

  it("workspace 路由切换主内容区的全尺寸布局", async () => {
    const view = await renderAppShell("/workspace");
    const shell = shellElement(view.container);

    expect(shell).toHaveClass("is-workspace-layout");
    expect(view.router.currentRoute.value.meta.contentLayout).toBe("workspace");

    await view.router.push("/");
    await waitFor(() => {
      expect(shell).not.toHaveClass("is-workspace-layout");
    });
  });

  it("公共壳层渲染应用注入的标题栏动作", async () => {
    const onRefresh = vi.fn();
    const TitlebarActions = defineComponent({
      setup() {
        return { onRefresh };
      },
      template: `<button type="button" class="titlebar__btn" data-agent-id="titlebar.app.refresh" @click="onRefresh">刷新</button>`,
    });
    const view = await renderAppShell("/", testAppConfig, { titlebarActions: TitlebarActions });

    const refresh = agentTarget(view.container, "titlebar.app.refresh");
    expect(refresh.closest("[data-agent-id='titlebar.window-controls']")).not.toBeNull();
    await fireEvent.click(refresh);
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("主侧边栏支持应用注入顶部业务区并保留全局动作回退", async () => {
    const TopContent = defineComponent({
      template: `<button type="button" data-agent-id="sidebar.custom-top">搜索会话</button>`,
    });
    const custom = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        topContent: TopContent,
        globalActions: [{ key: "fallback", label: "回退动作", icon: "search" }],
      },
    });

    expect(agentTarget(custom.container, "sidebar.custom-top")).toHaveTextContent("搜索会话");
    expect(custom.queryByRole("button", { name: "回退动作" })).not.toBeInTheDocument();

    const fallback = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        globalActions: [{ key: "fallback", label: "回退动作", icon: "search" }],
      },
    });
    expect(agentTarget(fallback.container, "sidebar.global.fallback")).toBeInTheDocument();
  });

  it("setup overlay 激活时隐藏侧栏和拖拽线并禁用左侧栏按钮", async () => {
    const setupOverlayActive = ref(true);
    const view = await renderAppShell("/", testAppConfig, {
      setupOverlayActive,
    });
    const shell = shellElement(view.container);
    const leftToggle = view.getByRole("button", { name: "折叠左侧栏" });

    expect(shell).toHaveClass("is-setup-overlay");
    expect(leftToggle).toBeDisabled();
    expect(view.container.querySelector(".secondary-panel")).not.toBeInTheDocument();
    expect(view.container.querySelector(".shell__resizer")).not.toBeInTheDocument();

    setupOverlayActive.value = false;
    await waitFor(() => {
      expect(shell).not.toHaveClass("is-setup-overlay");
    });
    expect(leftToggle).not.toBeDisabled();
    expect(view.container.querySelector(".secondary-panel")).toBeInTheDocument();
    expect(view.container.querySelector(".shell__resizer")).toBeInTheDocument();
  });

  it("主侧边栏支持字符串图标和自定义组件图标配置", async () => {
    const CustomIcon = defineComponent({
      template: `<span data-testid="custom-sidebar-icon" aria-hidden="true" />`,
    });
    const view = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        nav: [
          {
            key: "overview",
            to: "/",
            label: "首页",
            icon: "home",
          },
          {
            key: "custom",
            to: "/components",
            label: "自定义",
            icon: CustomIcon,
          },
        ],
      },
    });

    await waitFor(() => {
      expect(sidebarRowForText(view.container, "首页").querySelector("svg")).toBeInTheDocument();
    });
    expect(await view.findByTestId("custom-sidebar-icon")).toBeInTheDocument();
  });

  it("主侧边栏将固定导航、滚动分组和底部状态拆成稳定区域", async () => {
    const rowToolAction = vi.fn();
    const view = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        groups: [
          {
            key: "repositories",
            title: "仓库",
            items: Array.from({ length: 100 }, (_, index) => {
              const suffix = String(index + 1).padStart(3, "0");
              return {
                key: `repo-${suffix}`,
                label: `Repo ${suffix}`,
                icon: "folder",
                tools: index === 0
                  ? [{ key: "open", label: "打开仓库 001", icon: "folder", onSelect: rowToolAction }]
                  : undefined,
              };
            }),
          },
        ],
      },
    });

    const top = sidebarZone(view.container, "secondary-panel__top");
    const body = sidebarZone(view.container, "secondary-panel__body");
    const footer = sidebarZone(view.container, "secondary-panel__footer");
    const overview = agentTarget(view.container, "sidebar.nav.overview");
    const group = agentTarget(view.container, "sidebar.group.repositories");
    const footerSettings = agentTarget(view.container, "sidebar.footer.settings");
    const footerStatus = agentTarget(view.container, "sidebar.footer.status");

    expect(top).toContainElement(overview);
    expect(body).toContainElement(group);
    expect(body).toContainElement(sidebarRowForText(view.container, "Repo 100"));
    expect(footer).toContainElement(footerSettings);
    expect(footer).toContainElement(footerStatus);
    expect(body).not.toContainElement(overview);
    expect(body).not.toContainElement(footerSettings);

    await fireEvent.click(view.getByRole("button", { name: "打开仓库 001" }));
    expect(rowToolAction).toHaveBeenCalledOnce();
  });

  it("主侧边栏行和工具按钮触发配置动作并禁用未接入动作", async () => {
    const globalAction = vi.fn();
    const navAction = vi.fn();
    const disabledNavAction = vi.fn();
    const navToolAction = vi.fn();
    const groupToolAction = vi.fn();
    const rowAction = vi.fn();
    const rowToolAction = vi.fn();
    const view = await renderAppShell("/", {
      ...testAppConfig,
      sidebar: {
        ...testAppConfig.sidebar,
        globalActions: [
          { key: "refresh", label: "刷新", icon: "search", onSelect: globalAction },
          { key: "missing", label: "未接入", icon: "more" },
        ],
        nav: [
          {
            key: "components",
            to: "/components",
            label: "组件",
            icon: "folder",
            tools: [{
              key: "pin",
              label: "固定",
              icon: "more",
              active: true,
              onSelect: navToolAction,
            }],
          },
          {
            key: "scan",
            label: "扫描",
            icon: "search",
            onSelect: navAction,
          },
          {
            key: "disabled-scan",
            label: "禁用扫描",
            icon: "search",
            disabled: true,
            onSelect: disabledNavAction,
          },
        ],
        groups: [
          {
            key: "repositories",
            title: "仓库",
            tools: [{ key: "add", label: "添加仓库", icon: "file-plus", onSelect: groupToolAction }],
            items: [
              {
                key: "demo",
                label: "Demo",
                icon: "folder",
                active: true,
                onSelect: rowAction,
                tools: [{ key: "open", label: "打开仓库", icon: "folder", onSelect: rowToolAction }],
              },
            ],
          },
        ],
      },
    });

    await fireEvent.click(view.getByRole("button", { name: "刷新" }));
    await fireEvent.click(view.getByRole("button", { name: "扫描" }));
    await fireEvent.click(view.getByRole("button", { name: "禁用扫描" }));
    const navTool = view.getByRole("button", { name: "固定" });
    const rowTool = view.getByRole("button", { name: "打开仓库" });
    expect(navTool.parentElement?.closest("a, button")).toBeNull();
    expect(rowTool.parentElement?.closest("a, button")).toBeNull();

    await fireEvent.click(navTool);
    await fireEvent.click(view.getByRole("button", { name: "添加仓库" }));
    await fireEvent.click(view.getByRole("button", { name: "Demo" }));
    await fireEvent.click(rowTool);

    expect(globalAction).toHaveBeenCalledOnce();
    expect(navAction).toHaveBeenCalledOnce();
    expect(disabledNavAction).not.toHaveBeenCalled();
    expect(navToolAction).toHaveBeenCalledOnce();
    expect(view.getByRole("button", { name: "固定" })).toHaveClass("is-active");
    expect(groupToolAction).toHaveBeenCalledOnce();
    expect(rowAction).toHaveBeenCalledOnce();
    expect(rowToolAction).toHaveBeenCalledOnce();
    expect(view.getByRole("button", { name: "Demo" })).toHaveClass("is-active");
    expect(view.getByRole("button", { name: "未接入" })).toBeDisabled();
    expect(view.getByRole("button", { name: "禁用扫描" })).toBeDisabled();
    expect(view.router.currentRoute.value.fullPath).toBe("/");
  });

  it("主侧边栏只高亮当前精确路由", async () => {
    const view = await renderAppShell("/");
    const overview = agentTarget(view.container, "sidebar.nav.overview");
    const components = agentTarget(view.container, "sidebar.nav.components");

    expect(overview).toHaveClass("is-active");
    expect(components).not.toHaveClass("is-active");

    await view.router.push("/components");
    await waitFor(() => {
      expect(view.router.currentRoute.value.fullPath).toBe("/components");
    });

    expect(overview).not.toHaveClass("is-active");
    expect(components).toHaveClass("is-active");
  });

  it("左上角按钮切换左侧栏折叠状态并写回本地存储", async () => {
    const view = await renderAppShell();
    const shell = shellElement(view.container);
    const collapse = view.getByRole("button", { name: "折叠左侧栏" });

    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(leftResizer(view.container)).not.toHaveAttribute("aria-disabled");
    expect(collapse).toHaveAttribute("aria-pressed", "false");

    await fireEvent.click(collapse);

    expect(shell).toHaveClass("is-sidebar-collapsed");
    expect(leftResizer(view.container)).toHaveAttribute("aria-disabled", "true");
    expect(localStorage.getItem(SIDEBAR_CONFIG.collapsedStorageKey)).toBe("1");

    const expand = view.getByRole("button", { name: "展开左侧栏" });
    expect(expand).toHaveAttribute("aria-pressed", "true");

    await fireEvent.click(expand);

    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(leftResizer(view.container)).not.toHaveAttribute("aria-disabled");
    expect(localStorage.getItem(SIDEBAR_CONFIG.collapsedStorageKey)).toBe("0");
  });

  it("左侧栏宽度可拖拽调整、写回存储并双击恢复默认", async () => {
    localStorage.setItem(SIDEBAR_CONFIG.widthStorageKey, "260");
    const view = await renderAppShell();
    const shell = shellElement(view.container);
    const resizer = leftResizer(view.container);

    expect(shell.style.getPropertyValue("--sidebar-width")).toBe("260px");
    expect(resizer).toHaveAttribute("aria-valuemin", "180");
    expect(resizer).toHaveAttribute("aria-valuemax", "480");
    expect(resizer).toHaveAttribute("aria-valuenow", "260");

    await fireEvent.pointerDown(resizer, {
      button: 0,
      clientX: 200,
      pointerId: 1,
    });
    await fireEvent.pointerMove(window, {
      clientX: 300,
      pointerId: 1,
    });

    await waitFor(() => {
      expect(shell.style.getPropertyValue("--sidebar-width")).toBe("360px");
      expect(resizer).toHaveAttribute("aria-valuenow", "360");
    });

    await fireEvent.pointerUp(window, {
      clientX: 300,
      pointerId: 1,
    });

    expect(localStorage.getItem(SIDEBAR_CONFIG.widthStorageKey)).toBe("360");

    await fireEvent.dblClick(resizer);

    expect(shell.style.getPropertyValue("--sidebar-width")).toBe("220px");
    expect(localStorage.getItem(SIDEBAR_CONFIG.widthStorageKey)).toBe("220");
  });

  it("左侧栏拖拽取消或窗口失焦后恢复主界面交互", async () => {
    const view = await renderAppShell();
    const shell = shellElement(view.container);
    const resizer = leftResizer(view.container);
    const collapse = view.getByRole("button", { name: "折叠左侧栏" });

    await fireEvent.pointerDown(resizer, {
      button: 0,
      clientX: 220,
      pointerId: 1,
    });
    expect(shell).toHaveClass("is-resizing");

    await fireEvent.pointerCancel(window, { pointerId: 1 });
    expect(shell).not.toHaveClass("is-resizing");

    await fireEvent.pointerDown(resizer, {
      button: 0,
      clientX: 220,
      pointerId: 2,
    });
    expect(shell).toHaveClass("is-resizing");

    window.dispatchEvent(new Event("blur"));
    await waitFor(() => {
      expect(shell).not.toHaveClass("is-resizing");
    });

    await fireEvent.click(collapse);
    expect(shell).toHaveClass("is-sidebar-collapsed");
  });

  it("设置页替换左侧栏、禁用折叠并保留折叠偏好", async () => {
    localStorage.setItem(SIDEBAR_CONFIG.collapsedStorageKey, "1");
    const view = await renderAppShell("/settings");
    const shell = shellElement(view.container);
    const leftToggle = view.getByRole("button", { name: "折叠左侧栏" });

    expect(shell).toHaveClass("is-settings-mode");
    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(leftToggle).toBeDisabled();
    expect(view.getByRole("navigation", { name: "设置分类" })).toBeInTheDocument();
    expect(agentTarget(view.container, "settings.sidebar")).toHaveAttribute("aria-label", "设置分类");
    expect(agentTarget(view.container, "settings.sidebar.back")).toHaveTextContent("返回");
    expect(agentTarget(view.container, "settings.tab.appearance")).toHaveClass("is-active");
    expect(agentTarget(view.container, "settings.tab.about")).toHaveTextContent("关于");
    expect(view.queryByRole("navigation", { name: "主导航" })).not.toBeInTheDocument();
    expect(view.container.querySelector('[data-agent-id="sidebar.footer.settings"]')).toBeNull();
    expect(view.getByRole("button", { name: /外观/ })).toHaveClass("is-active");
    expect(view.router.currentRoute.value.meta.sidebar).toBe("settings");
    expect(view.router.currentRoute.value.meta.lockSidebar).toBe(true);
    expect(localStorage.getItem(SIDEBAR_CONFIG.collapsedStorageKey)).toBe("1");

    await fireEvent.click(view.getByRole("button", { name: /关于/ }));

    await waitFor(() => {
      expect(view.router.currentRoute.value.fullPath).toBe("/settings?tab=about");
    });
    expect(view.getByRole("button", { name: /关于/ })).toHaveClass("is-active");

    await view.router.push("/");
    expect(shell).toHaveClass("is-sidebar-collapsed");
    expect(localStorage.getItem(SIDEBAR_CONFIG.collapsedStorageKey)).toBe("1");
  });

  it("设置页返回进入设置前的主窗口路由", async () => {
    const view = await renderAppShell("/");

    await view.router.push("/settings?tab=about");
    await fireEvent.click(view.getByRole("button", { name: "返回" }));
    await waitFor(() => {
      expect(view.router.currentRoute.value.fullPath).toBe("/");
    });
  });
});

describe("LiliaAppShell window boundary", () => {
  it("renders window infrastructure without creating navigation or router content assumptions", () => {
    const NativeHost = defineComponent({ template: '<div data-testid="native-host">native</div>' });
    const Overlay = defineComponent({ template: '<div data-testid="overlay-host">overlay</div>' });
    const view = render(LiliaAppShell, {
      props: {
        title: "Workspace",
        overlayComponents: [Overlay],
      },
      slots: {
        default: '<section data-testid="workspace-content">content</section>',
        "native-host": NativeHost,
        "titlebar-leading": '<button aria-label="workspace command">command</button>',
      },
    });

    expect(view.getByTestId("workspace-content")).toBeInTheDocument();
    expect(view.getByTestId("native-host")).toBeInTheDocument();
    expect(view.getByTestId("overlay-host")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "workspace command" })).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "折叠左侧栏" })).not.toBeInTheDocument();
    expect(view.container.querySelector(".secondary-panel")).toBeNull();
    expect(view.container.querySelector(".shell__resizer")).toBeNull();
    expect(view.container.querySelector("main")).toBeNull();
  });
});
