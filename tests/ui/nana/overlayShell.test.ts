import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NanaButton, NanaDialog, NanaPopover, NanaTooltip } from "@lilia/nana-ui";
import { NanaAppShell, NanaSidebar } from "@lilia/nana-ui/shell";

function routerPlugin() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }, { path: "/settings", component: { template: "<div />" } }],
  });
}

afterEach(() => vi.useRealTimers());

describe("NanaUI overlay and shell behavior", () => {
  it("traps dialog focus, closes on Escape, and restores the opener", async () => {
    const view = render(defineComponent({
      components: { NanaButton, NanaDialog },
      data: () => ({ open: false }),
      template: `<NanaButton @click="open = true">打开</NanaButton><NanaDialog :open="open" title="确认操作" @close="open = false"><NanaButton>第一个操作</NanaButton><template #actions><NanaButton>最后一个操作</NanaButton></template></NanaDialog>`,
    }));
    const opener = screen.getByRole("button", { name: "打开" });
    opener.focus();
    await fireEvent.click(opener);
    await waitFor(() => expect(screen.getByRole("button", { name: "第一个操作" })).toHaveFocus());
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "关闭" })).toHaveFocus();
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(view.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("shows accessible tooltip content after intent delay", async () => {
    vi.useFakeTimers();
    render(defineComponent({
      components: { NanaButton, NanaTooltip },
      template: `<NanaTooltip text="说明"><NanaButton>目标</NanaButton></NanaTooltip>`,
    }));
    const trigger = screen.getByRole("button", { name: "目标" }).closest(".nana-tooltip-anchor");
    expect(trigger).not.toBeNull();
    await fireEvent.mouseEnter(trigger!);
    expect(screen.queryByRole("tooltip")).toBeNull();
    await vi.advanceTimersByTimeAsync(350);
    await nextTick();
    expect(screen.getByRole("tooltip")).toHaveTextContent("说明");
  });

  it("supports the shared controlled popover contract", async () => {
    render(defineComponent({
      components: { NanaPopover },
      data: () => ({ open: false }),
      template: `<NanaPopover v-model:open="open"><template #trigger><button>更多</button></template><button>重命名</button></NanaPopover>`,
    }));
    await fireEvent.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("button", { name: "重命名" })).toBeVisible();
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: "重命名" })).toBeNull();
  });

  it("keeps only top-level navigation and settings in icon mode", async () => {
    const router = routerPlugin();
    await router.push("/");
    await router.isReady();
    const view = render(NanaSidebar, {
      props: {
        mode: "icon",
        items: [
          { id: "home", label: "首页", icon: Home, href: "/", depth: 0 },
          { id: "child", label: "子项", icon: Home, depth: 1 },
        ],
        settingsItem: { id: "settings", label: "设置", icon: Settings, href: "/settings" },
      },
      global: { plugins: [router] },
    });
    expect(view.container.querySelectorAll(".nana-sidebar__nav .nana-sidebar__item")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "首页" })).toBeVisible();
    expect(screen.getByRole("link", { name: "设置" })).toBeVisible();
    await fireEvent.click(screen.getByRole("button", { name: "展开侧边栏" }));
    expect(view.emitted("update:mode")?.[0]).toEqual(["expanded"]);
  });

  it("does not navigate or emit selection for a disabled link", async () => {
    const router = routerPlugin();
    await router.push("/");
    await router.isReady();
    const view = render(NanaSidebar, {
      props: { items: [{ id: "settings", label: "设置", href: "/settings", disabled: true }] },
      global: { plugins: [router] },
    });
    await fireEvent.click(screen.getByRole("link", { name: "设置" }));
    expect(router.currentRoute.value.path).toBe("/");
    expect(view.emitted("select")).toBeUndefined();
  });

  it("renders common application slots without requiring a Router", async () => {
    const view = render(NanaAppShell, {
      props: { title: "Nana Workspace" },
      slots: {
        "header-actions": "<button>保存</button>",
        default: "<main>主要任务</main>",
        overlays: "<div>应用浮层</div>",
      },
    });
    expect(screen.getByText("主要任务")).toBeVisible();
    expect(screen.getByRole("button", { name: "保存" })).toBeVisible();
    expect(screen.getByText("应用浮层")).toBeVisible();
    expect(view.container.querySelector("main main")).toBeNull();
  });

  it("renders grouped items, badges, actions, and disabled actions", async () => {
    const router = routerPlugin();
    await router.push("/");
    await router.isReady();
    const pin = vi.fn();
    const remove = vi.fn();
    render(NanaSidebar, {
      props: {
        sections: [{
          id: "inbox",
          label: "收集箱",
          items: [{
            id: "chat-1",
            label: "会话一",
            href: "/",
            badges: [{ id: "phase", label: "运行中", tone: "warning" }],
            actions: [
              { id: "pin", label: "置顶", run: pin },
              { id: "delete", label: "删除", disabled: true, run: remove },
            ],
          }],
        }],
      },
      global: { plugins: [router] },
    });
    expect(screen.getByText("收集箱")).toBeVisible();
    expect(screen.getByText("运行中")).toBeVisible();
    await fireEvent.click(screen.getByRole("button", { name: "置顶" }));
    expect(pin).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
    expect(remove).not.toHaveBeenCalled();
  });
});
