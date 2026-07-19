import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import Dropdown from "@lilia/ui/components/Dropdown";
import { SB_MENU_POP_TRANSITION_MS } from "@lilia/ui/composables/menuMotion";

const options = [
  { value: "bottom", label: "向下展开", hint: "从按钮点击点展开菜单" },
  { value: "top", label: "向上展开", hint: "用于贴近页面底部的场景" },
] as const;

function renderDropdown() {
  return render(defineComponent({
    components: { Dropdown },
    setup() {
      const value = ref<"bottom" | "top">("bottom");
      return { options, value };
    },
    template: `
      <Dropdown
        v-model="value"
        :options="options"
        placement="bottom"
      />
    `,
  }), {
    global: {
      stubs: {
        transition: false,
      },
    },
  });
}

describe("Dropdown", () => {
  it("keeps 500-option multi-select updates correct", async () => {
    const largeOptions = Array.from({ length: 500 }, (_, index) => ({
      label: `Option ${index}`,
      value: `option-${index}`,
    }));
    const view = render(defineComponent({
      components: { Dropdown },
      setup() {
        const value = ref(largeOptions.slice(0, 250).map((option) => option.value));
        return { largeOptions, value };
      },
      template: `
        <Dropdown v-model="value" :options="largeOptions" multiple placement="bottom" />
        <output data-testid="selection-count">{{ value.length }}</output>
      `,
    }), {
      global: { stubs: { transition: false } },
    });

    await fireEvent.click(view.container.querySelector<HTMLButtonElement>(".dd__button")!);
    const unchangedOption = await screen.findByRole("option", { name: "Option 301" });
    await fireEvent.click(await screen.findByRole("option", { name: "Option 300" }));

    expect(screen.getByTestId("selection-count")).toHaveTextContent("251");
    expect(screen.getByRole("option", { name: "Option 300" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Option 301" })).toBe(unchangedOption);
  });

  it("可打开、选中选项并关闭", async () => {
    renderDropdown();

    await fireEvent.click(screen.getByRole("button", { name: /向下展开/i }));
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /向上展开/i })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("option", { name: /向上展开/i }));

    await waitFor(
      () => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      },
      { timeout: SB_MENU_POP_TRANSITION_MS + 400 },
    );
    expect(screen.getByRole("button", { name: /向上展开/i })).toBeInTheDocument();
  });

  it("隐藏按钮文字时保留当前选项名称和选择行为", async () => {
    render(defineComponent({
      components: { Dropdown },
      setup() {
        const value = ref<"bottom" | "top">("bottom");
        return { options, value };
      },
      template: `
        <Dropdown
          v-model="value"
          :options="options"
          placement="bottom"
          hide-button-label
        />
      `,
    }), {
      global: {
        stubs: {
          transition: false,
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "向下展开" }));
    await fireEvent.click(await screen.findByRole("option", { name: /向上展开/i }));

    await waitFor(
      () => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      },
      { timeout: SB_MENU_POP_TRANSITION_MS + 400 },
    );
    expect(screen.getByRole("button", { name: "向上展开" })).toBeInTheDocument();
  });

  it("closes when dismissed by outside pointer or Escape", async () => {
    renderDropdown();
    const button = screen.getByRole("button", { name: /向下展开/i });

    await fireEvent.click(button);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    await fireEvent.click(button);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("向下展开时会从触发点击位置展开", async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function mockRect(this: HTMLElement) {
        if (this.classList.contains("dd")) {
          return {
            x: 100,
            y: 200,
            left: 100,
            top: 200,
            right: 220,
            bottom: 232,
            width: 120,
            height: 32,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (this.classList.contains("dd__button")) {
          return {
            x: 100,
            y: 200,
            left: 100,
            top: 200,
            right: 220,
            bottom: 232,
            width: 120,
            height: 32,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (this.classList.contains("dd__menu")) {
          return {
            x: 100,
            y: 238,
            left: 100,
            top: 238,
            right: 280,
            bottom: 318,
            width: 180,
            height: 80,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetBoundingClientRect.call(this);
      },
    });

    try {
      renderDropdown();
      await fireEvent.click(screen.getByRole("button", { name: /向下展开/i }), {
        clientX: 136,
        clientY: 216,
      });

      const listbox = await screen.findByRole("listbox");
      await waitFor(() => {
        expect(listbox).toHaveStyle({
          "--sb-menu-origin-x": "36px",
          "--sb-menu-origin-y": "0px",
        });
      });
    } finally {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
    }
  });

  it("默认向上展开时会从触发边缘缩放", async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function mockRect(this: HTMLElement) {
        if (this.classList.contains("dd")) {
          return {
            x: 100,
            y: 200,
            left: 100,
            top: 200,
            right: 220,
            bottom: 232,
            width: 120,
            height: 32,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (this.classList.contains("dd__button")) {
          return {
            x: 100,
            y: 200,
            left: 100,
            top: 200,
            right: 220,
            bottom: 232,
            width: 120,
            height: 32,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (this.classList.contains("dd__menu")) {
          return {
            x: 100,
            y: 114,
            left: 100,
            top: 114,
            right: 280,
            bottom: 194,
            width: 180,
            height: 80,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetBoundingClientRect.call(this);
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return this.classList.contains("dd__menu") ? 180 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return this.classList.contains("dd__menu") ? 80 : 0;
      },
    });

    try {
      render(defineComponent({
        components: { Dropdown },
        setup() {
          const value = ref<"bottom" | "top">("bottom");
          return { options, value };
        },
        template: `
          <Dropdown
            v-model="value"
            :options="options"
          />
        `,
      }), {
        global: {
          stubs: {
            transition: false,
          },
        },
      });

      await fireEvent.click(screen.getByRole("button", { name: /向下展开/i }), {
        clientX: 136,
        clientY: 216,
      });

      const listbox = await screen.findByRole("listbox");
      await waitFor(() => {
        expect(listbox).toHaveStyle({
          "--sb-menu-origin-x": "36px",
          "--sb-menu-origin-y": "80px",
        });
      });
    } finally {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
      }
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
      }
    }
  });

  it("block 模式下菜单宽度匹配触发按钮", async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function mockRect(this: HTMLElement) {
        if (this.classList.contains("dd__button")) {
          return {
            x: 40,
            y: 80,
            left: 40,
            top: 80,
            right: 360,
            bottom: 114,
            width: 320,
            height: 34,
            toJSON: () => ({}),
          } as DOMRect;
        }
        if (this.classList.contains("dd__menu")) {
          return {
            x: 40,
            y: 120,
            left: 40,
            top: 120,
            right: 260,
            bottom: 188,
            width: 220,
            height: 68,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetBoundingClientRect.call(this);
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return this.classList.contains("dd__menu") ? 220 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return this.classList.contains("dd__menu") ? 68 : 0;
      },
    });

    try {
      render(defineComponent({
        components: { Dropdown },
        setup() {
          const value = ref<"bottom" | "top">("bottom");
          return { options, value };
        },
        template: `
          <Dropdown
            v-model="value"
            :options="options"
            block
            size="large"
            placement="bottom"
          />
        `,
      }), {
        global: {
          stubs: {
            transition: false,
          },
        },
      });

      await fireEvent.click(screen.getByRole("button", { name: /向下展开/i }));

      const listbox = await screen.findByRole("listbox");
      await waitFor(() => {
        expect(listbox).toHaveStyle({ width: "320px" });
        expect(listbox).toHaveStyle({ left: "0px", top: "0px" });
        expect((listbox as HTMLElement).style.getPropertyValue("translate")).toBe("40px 120px");
      });
    } finally {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
      }
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
      }
    }
  });
});
