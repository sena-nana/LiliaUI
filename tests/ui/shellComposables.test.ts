import { defineComponent, nextTick, ref } from "vue";
import { fireEvent, render } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLiliaUiConfig } from "@lilia/ui/shell";
import {
  usePersistentBoolean,
  usePersistentNumber,
  usePersistentString,
} from "@lilia/ui/composables/usePersistentState";
import { useResizablePane } from "@lilia/ui/composables/useResizablePane";
import { testAppConfig } from "./fixtures/appConfig";

beforeEach(() => {
  localStorage.clear();
  setLiliaUiConfig(testAppConfig);
});

describe("persistent state composables", () => {
  it("持久化 boolean 使用 1/0 存储并支持默认值", async () => {
    const Probe = defineComponent({
      setup() {
        const enabled = usePersistentBoolean("test.boolean", true);
        return { enabled };
      },
      template: `<button @click="enabled = !enabled">{{ String(enabled) }}</button>`,
    });

    const view = render(Probe);
    expect(view.getByRole("button")).toHaveTextContent("true");

    await fireEvent.click(view.getByRole("button"));

    expect(view.getByRole("button")).toHaveTextContent("false");
    expect(localStorage.getItem("test.boolean")).toBe("0");
  });

  it("持久化 number 会读取、clamp 并写回", async () => {
    localStorage.setItem("test.number", "999");
    const Probe = defineComponent({
      setup() {
        const size = usePersistentNumber({
          key: "test.number",
          defaultValue: 12,
          min: 4,
          max: 20,
        });
        return { size };
      },
      template: `<button @click="size = 2">{{ size }}</button>`,
    });

    const view = render(Probe);
    expect(view.getByRole("button")).toHaveTextContent("20");

    await fireEvent.click(view.getByRole("button"));

    expect(view.getByRole("button")).toHaveTextContent("4");
    expect(localStorage.getItem("test.number")).toBe("4");
  });

  it("持久化 string 会读取默认值并写回更新", async () => {
    const Probe = defineComponent({
      setup() {
        const value = usePersistentString("test.string", "codex");
        return { value };
      },
      template: `<button @click="value = 'claude'">{{ value }}</button>`,
    });

    const view = render(Probe);
    expect(view.getByRole("button")).toHaveTextContent("codex");

    await fireEvent.click(view.getByRole("button"));

    expect(view.getByRole("button")).toHaveTextContent("claude");
    expect(localStorage.getItem("test.string")).toBe("claude");
  });
});

describe("shell sidebar composable", () => {
  it("拖拽宽度更新按动画帧合并并在结束时写入最后位置", async () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    try {
      const Probe = defineComponent({
        setup() {
          const disabled = ref(false);
          const pane = useResizablePane({
            storageKey: "test.resize",
            minWidth: 120,
            maxWidth: 320,
            defaultWidth: 200,
            edge: "right",
            disabled,
          });
          return { pane };
        },
        template: `
          <div>
            <button aria-label="resize" @pointerdown="pane.startResize" />
            <span data-testid="width">{{ pane.width.value }}</span>
            <span data-testid="resizing">{{ String(pane.isResizing.value) }}</span>
          </div>
        `,
      });

      const view = render(Probe);
      const handle = view.getByRole("button", { name: "resize" });
      expect(view.getByTestId("width")).toHaveTextContent("200");

      await fireEvent.pointerDown(handle, { button: 0, clientX: 100, pointerId: 1 });
      await fireEvent.pointerMove(window, { clientX: 160, pointerId: 1 });
      expect(view.getByTestId("width")).toHaveTextContent("200");

      frameCallbacks.shift()?.(0);
      await nextTick();
      expect(view.getByTestId("width")).toHaveTextContent("260");

      await fireEvent.pointerMove(window, { clientX: 180, pointerId: 1 });
      await fireEvent.pointerUp(window, { pointerId: 1 });
      await nextTick();

      expect(view.getByTestId("resizing")).toHaveTextContent("false");
      expect(view.getByTestId("width")).toHaveTextContent("280");
      expect(localStorage.getItem("test.resize")).toBe("280");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
