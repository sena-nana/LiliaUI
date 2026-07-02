import { fireEvent, render } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import { SidebarCollapse } from "@lilia/ui";

function collapseRoot(child: HTMLElement): HTMLElement {
  const root = child.closest(".sidebar-collapse");
  if (!(root instanceof HTMLElement)) {
    throw new Error("未找到侧边栏折叠容器");
  }
  return root;
}

describe("SidebarCollapse", () => {
  it("关闭时隐藏并隔离插槽内容，打开后恢复可达状态", async () => {
    const Probe = defineComponent({
      components: { SidebarCollapse },
      setup() {
        const open = ref(false);
        return { open };
      },
      template: `
        <button type="button" @click="open = !open">切换</button>
        <SidebarCollapse :open="open">
          <button type="button">仓库</button>
        </SidebarCollapse>
      `,
    });

    const view = render(Probe);
    const child = view.getByRole("button", { name: "仓库", hidden: true });
    const root = collapseRoot(child);

    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("inert");
    expect(view.queryByRole("button", { name: "仓库" })).toBeNull();

    await fireEvent.click(view.getByRole("button", { name: "切换" }));

    expect(root).not.toHaveAttribute("aria-hidden");
    expect(root).not.toHaveAttribute("inert");
    expect(view.getByRole("button", { name: "仓库" })).toBe(child);
  });

  it("允许调用方关闭 inert 隔离", () => {
    const view = render(SidebarCollapse, {
      props: {
        inertWhenClosed: false,
        open: false,
      },
      slots: {
        default: "<button type=\"button\">保留交互</button>",
      },
    });

    const root = collapseRoot(view.getByRole("button", { name: "保留交互", hidden: true }));
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("inert");
  });
});
