import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import ContextMenuHost from "@lilia/ui/components/ContextMenuHost";
import { SB_MENU_POP_TRANSITION_MS } from "@lilia/ui/composables/menuMotion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import {
  closeContextMenu,
  installContextMenu,
  openContextMenuAt,
  uninstallContextMenu,
  type ContextMenuItem,
} from "@lilia/ui/composables/useContextMenu";
import { installLiliaContextMenu } from "@lilia/ui/runtime";
import { vContextMenu } from "@lilia/ui/directives/contextMenu";

function renderWithTemplate(template: string, setup: () => Record<string, unknown>) {
  const Wrapper = defineComponent({
    components: { ContextMenuHost },
    template: `${template}<ContextMenuHost />`,
    setup,
  });

  return render(Wrapper, {
    global: {
      directives: {
        contextMenu: vContextMenu,
      },
    },
  });
}

async function waitForMenuLeave() {
  await vi.advanceTimersByTimeAsync(SB_MENU_POP_TRANSITION_MS + 50);
}

async function expectMenuTranslate(x: number, y: number) {
  const menu = await screen.findByRole("menu");
  await waitFor(() => {
    expect(menu).toHaveStyle({ left: "0px", top: "0px" });
    expect((menu as HTMLElement).style.getPropertyValue("translate")).toBe(`${x}px ${y}px`);
  });
  return menu;
}

describe("ContextMenuHost", () => {
  beforeEach(() => {
    closeContextMenu();
    installContextMenu();
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(180);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(96);
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1024);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(768);
  });

  afterEach(() => {
    closeContextMenu();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("只在菜单打开期间绑定高频全局监听器", () => {
    uninstallContextMenu();
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");

    installContextMenu();
    for (const type of ["pointerdown", "keydown", "scroll", "resize", "blur"]) {
      expect(addListener.mock.calls.some(([eventType]) => eventType === type)).toBe(false);
    }

    openContextMenuAt(20, 24, [{ id: "open", label: "打开" }]);
    for (const type of ["pointerdown", "keydown", "scroll", "resize", "blur"]) {
      expect(addListener.mock.calls.some(([eventType]) => eventType === type)).toBe(true);
    }

    closeContextMenu();
    for (const type of ["pointerdown", "keydown", "scroll", "resize", "blur"]) {
      expect(removeListener.mock.calls.some(([eventType]) => eventType === type)).toBe(true);
    }
  });

  it("应用显式组合菜单 Host 后可响应右键菜单", async () => {
    const Wrapper = defineComponent({
      components: { ContextMenuHost },
      template: `
        <button data-testid="target" v-context-menu="items">目标</button>
        <ContextMenuHost />
      `,
      setup: () => ({
        items: [{ id: "open", label: "打开", onSelect: vi.fn() }],
      }),
    });

    render(Wrapper, {
      global: {
        directives: {
          contextMenu: vContextMenu,
        },
      },
    });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await fireEvent.contextMenu(screen.getByTestId("target"), {
      clientX: 96,
      clientY: 128,
    });

    await expectMenuTranslate(96, 128);
  });

  it("应用运行时会注册右键菜单指令", async () => {
    const action = vi.fn();
    const Wrapper = defineComponent({
      components: { ContextMenuHost },
      template: `<button data-testid="target" v-context-menu="items">目标</button><ContextMenuHost />`,
      setup: () => ({
        items: [{ id: "open", label: "打开", onSelect: action }],
      }),
    });

    render(Wrapper, {
      global: {
        plugins: [
          {
            install(app) {
              installLiliaContextMenu(app);
            },
          },
        ],
      },
    });

    await fireEvent.contextMenu(screen.getByTestId("target"), {
      clientX: 96,
      clientY: 128,
    });

    await fireEvent.click(await screen.findByRole("menuitem", { name: "打开" }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("全局屏蔽浏览器原生右键菜单", () => {
    render(ContextMenuHost);

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 24,
    });
    document.body.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("provider 返回空数组时继续向祖先查找菜单项", async () => {
    const action = vi.fn();
    const parentMenu: ContextMenuItem[] = [
      { id: "open", label: "打开", onSelect: action },
      { id: "disabled", label: "不可用", disabled: true, onSelect: vi.fn() },
    ];

    renderWithTemplate(
      `
        <div data-testid="parent" v-context-menu="parentMenu">
          <button data-testid="target" v-context-menu="emptyMenu">目标</button>
        </div>
      `,
      () => ({
        parentMenu,
        emptyMenu: () => [],
      }),
    );

    await fireEvent.contextMenu(screen.getByTestId("target"), {
      clientX: 96,
      clientY: 128,
    });

    await expectMenuTranslate(96, 128);
    expect(screen.getByRole("menuitem", { name: "打开" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "不可用" })).toBeDisabled();

    await fireEvent.click(screen.getByRole("menuitem", { name: "打开" }));
    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("菜单会 clamp 在视口内", async () => {
    renderWithTemplate(
      `<button data-testid="target" v-context-menu="items">目标</button>`,
      () => ({
        items: [{ id: "open", label: "打开", onSelect: vi.fn() }],
      }),
    );

    await fireEvent.contextMenu(screen.getByTestId("target"), {
      clientX: 1000,
      clientY: 750,
    });

    await expectMenuTranslate(840, 654);
  });

  it("危险项支持二次确认", async () => {
    const action = vi.fn();
    renderWithTemplate(
      `<button data-testid="target" v-context-menu="items">目标</button>`,
      () => ({
        items: [
          {
            id: "delete",
            label: "删除",
            danger: true,
            confirmLabel: "确认删除？再点一次",
            onSelect: action,
          },
        ],
      }),
    );

    await fireEvent.contextMenu(screen.getByTestId("target"));
    await fireEvent.click(await screen.findByRole("menuitem", { name: "删除" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "确认删除？再点一次" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("menuitem", { name: "确认删除？再点一次" }));

    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("父项悬浮或聚焦时显示子菜单并执行子项", async () => {
    const action = vi.fn();
    renderWithTemplate(
      `<button data-testid="target" v-context-menu="items">目标</button>`,
      () => ({
        items: [
          {
            id: "move",
            label: "移动到分组",
            children: [{ id: "frontend", label: "前端", onSelect: action }],
          },
          { id: "hide", label: "隐藏仓库", onSelect: vi.fn() },
        ],
      }),
    );

    await fireEvent.contextMenu(screen.getByTestId("target"));
    const rootMenu = await screen.findByRole("menu");
    const parentItem = screen.getByRole("menuitem", { name: "移动到分组" });

    expect(parentItem).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menuitem", { name: "前端" })).toBeNull();

    await fireEvent.mouseEnter(parentItem);
    expect(parentItem).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menu")).toHaveLength(2);
    expect(screen.getByRole("menuitem", { name: "前端" })).toBeInTheDocument();

    await fireEvent.mouseLeave(rootMenu);
    expect(parentItem).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menuitem", { name: "前端" })).toBeNull();

    await fireEvent.focus(parentItem);
    expect(parentItem).toHaveAttribute("aria-expanded", "true");

    await fireEvent.click(screen.getByRole("menuitem", { name: "前端" }));
    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("Esc 会关闭菜单", async () => {
    vi.useFakeTimers();
    const Wrapper = defineComponent({
      components: { ContextMenuHost },
      template: `<button data-testid="target" v-context-menu="items">目标</button><ContextMenuHost />`,
      setup: () => ({
        items: [{ id: "open", label: "打开", onSelect: vi.fn() }],
      }),
    });
    render(Wrapper, {
      global: {
        directives: { contextMenu: vContextMenu },
        stubs: { transition: false },
      },
    });

    await fireEvent.contextMenu(screen.getByTestId("target"));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("menuitem", { name: "打开" })).toBeInTheDocument();

    await waitForMenuLeave();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("可以用坐标程序化打开菜单", async () => {
    render(ContextMenuHost);

    openContextMenuAt(40, 52, [{ id: "open", label: "打开", onSelect: vi.fn() }]);

    await expectMenuTranslate(40, 52);
  });

  it("可搜索菜单支持分类二级菜单与查询扁平化", async () => {
    const addInput = vi.fn();
    const addMath = vi.fn();
    renderWithTemplate(
      `<button data-testid="target" v-context-menu="menu">目标</button>`,
      () => ({
        menu: {
          searchable: true,
          searchPlaceholder: "搜索节点",
          emptyText: "没有匹配节点",
          items: [
            {
              id: "input",
              label: "Input",
              children: [
                { id: "input.uv", label: "UV", keywords: ["input.uv"], onSelect: addInput },
              ],
            },
            {
              id: "math",
              label: "Math",
              children: [
                { id: "math.add", label: "Add", keywords: ["math.add_float"], onSelect: addMath },
              ],
            },
          ],
        },
      }),
    );

    await fireEvent.contextMenu(screen.getByTestId("target"));
    expect(await screen.findByRole("menuitem", { name: "Input" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索节点")).toBeInTheDocument();

    await fireEvent.mouseEnter(screen.getByRole("menuitem", { name: "Input" }));
    const submenu = document.querySelector<HTMLElement>("[data-agent-id='context-menu.submenu.input']");
    const rootMenu = document.querySelector<HTMLElement>("[data-agent-id='context-menu']");
    expect(submenu).toBeTruthy();
    expect(rootMenu).toBeTruthy();
    expect(submenu!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      rootMenu!.getBoundingClientRect().right - 1,
    );

    await fireEvent.update(screen.getByPlaceholderText("搜索节点"), "add");
    expect(screen.queryByRole("menuitem", { name: "Input" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Add" })).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("menuitem", { name: "Add" }));
    expect(addMath).toHaveBeenCalledTimes(1);
    expect(addInput).not.toHaveBeenCalled();
  });

  it("可搜索菜单在无匹配时显示空态", async () => {
    render(ContextMenuHost);
    openContextMenuAt(
      40,
      52,
      [{ id: "input", label: "Input", children: [{ id: "uv", label: "UV", onSelect: vi.fn() }] }],
      { searchable: true, searchPlaceholder: "搜索空态", emptyText: "没有匹配节点" },
    );

    await fireEvent.update(await screen.findByPlaceholderText("搜索空态"), "missing");
    expect(screen.getByText("没有匹配节点")).toBeInTheDocument();
  });

  it("菜单内部滚动不关闭，外部滚动仍关闭", async () => {
    vi.useFakeTimers();
    render(ContextMenuHost);
    openContextMenuAt(
      40,
      52,
      Array.from({ length: 8 }, (_, index) => ({
        id: `group-${index}`,
        label: `分组 ${index}`,
        children: [
          { id: `item-${index}`, label: `节点 ${index}`, keywords: ["node"], onSelect: vi.fn() },
        ],
      })),
      { searchable: true, searchPlaceholder: "搜索滚动", emptyText: "没有匹配节点" },
    );

    await fireEvent.update(await screen.findByPlaceholderText("搜索滚动"), "node");
    const scrollArea = document.querySelector<HTMLElement>(".ctx-menu__scroll");
    expect(scrollArea).toBeTruthy();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    scrollArea!.dispatchEvent(new Event("scroll", { bubbles: true }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    document.body.dispatchEvent(new Event("scroll", { bubbles: true }));
    await waitForMenuLeave();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("退场期间重新打开时应显示新的菜单内容", async () => {
    vi.useFakeTimers();
    render(ContextMenuHost, {
      global: {
        stubs: {
          transition: false,
        },
      },
    });

    openContextMenuAt(48, 56, [{ id: "old-item", label: "旧菜单", onSelect: vi.fn() }]);
    expect(await screen.findByRole("menuitem", { name: "旧菜单" })).toBeInTheDocument();

    closeContextMenu();
    openContextMenuAt(92, 88, [{ id: "new-item", label: "新菜单", onSelect: vi.fn() }]);

    expect(await screen.findByRole("menuitem", { name: "新菜单" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "旧菜单" })).not.toBeInTheDocument();

    await waitForMenuLeave();
    expect(screen.getByRole("menuitem", { name: "新菜单" })).toBeInTheDocument();
  });
});
