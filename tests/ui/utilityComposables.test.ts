import { render } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDomEventListener,
  createLazyLoadState,
  highlightQuerySegments,
  highlightRangeSegments,
  installCombinedUnlisten,
  installUnlistenFns,
  scheduleAfterPaint,
  useAnchoredOverlay,
  useFocusOnActivation,
  withComponentEpoch,
  type ComponentEpoch,
} from "@lilia/ui";

describe("lazy load state", () => {
  it("caches successful loads and shares pending loads", async () => {
    let resolveLoad: (value: string) => void = () => undefined;
    const loader = vi.fn(() => new Promise<string>((resolve) => {
      resolveLoad = resolve;
    }));
    const state = createLazyLoadState(loader);

    const first = state.load();
    const second = state.load();
    resolveLoad("ready");

    await expect(Promise.all([first, second])).resolves.toEqual(["ready", "ready"]);
    expect(await state.load()).toBe("ready");
    expect(loader).toHaveBeenCalledTimes(1);
    expect(state.status.value).toBe("loaded");
  });

  it("keeps failure state and retries after a failed load", async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce("ok");
    const state = createLazyLoadState(loader);

    await expect(state.load()).rejects.toThrow("chunk failed");
    expect(state.status.value).toBe("error");
    expect(state.failed.value).toBe(true);

    await expect(state.retry()).resolves.toBe("ok");
    expect(loader).toHaveBeenCalledTimes(2);
    expect(state.status.value).toBe("loaded");
  });
});

describe("event listener helpers", () => {
  it("rolls back installed listeners when a later installer fails", async () => {
    const calls: string[] = [];

    await expect(installUnlistenFns([
      async () => {
        calls.push("install-a");
        return () => calls.push("unlisten-a");
      },
      async () => {
        calls.push("install-b");
        return () => calls.push("unlisten-b");
      },
      async () => {
        calls.push("install-c");
        throw new Error("install-c failed");
      },
    ])).rejects.toThrow("install-c failed");

    expect(calls).toEqual([
      "install-a",
      "install-b",
      "install-c",
      "unlisten-b",
      "unlisten-a",
    ]);
  });

  it("returns an idempotent combined unlisten function", async () => {
    const calls: string[] = [];
    const unlisten = await installCombinedUnlisten([
      async () => () => calls.push("unlisten-a"),
      async () => () => calls.push("unlisten-b"),
    ]);

    unlisten();
    unlisten();

    expect(calls).toEqual(["unlisten-b", "unlisten-a"]);
  });

  it("returns cleanup for DOM listeners", () => {
    const target = new EventTarget();
    const listener = vi.fn();

    const unlisten = addDomEventListener(target, "test-event", listener);
    target.dispatchEvent(new Event("test-event"));
    unlisten();
    target.dispatchEvent(new Event("test-event"));

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("text segment helpers", () => {
  it("creates stable query and range highlight segments", () => {
    expect(highlightQuerySegments("Alpha beta alpha", "alp")).toEqual([
      { text: "Alp", mark: true },
      { text: "ha beta ", mark: false },
      { text: "alp", mark: true },
      { text: "ha", mark: false },
    ]);

    expect(highlightRangeSegments("abcdef", [[1, 3], [2, 5]])).toEqual([
      { text: "a", mark: false },
      { text: "bcde", mark: true },
      { text: "f", mark: false },
    ]);
  });
});

describe("anchored overlay helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("installs viewport listeners while open and removes them on unmount", () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const Host = defineComponent({
      setup() {
        const open = ref(true);
        const preferredPlacement = ref<"bottom-start">("bottom-start");
        useAnchoredOverlay({ open, preferredPlacement });
        return () => h("div");
      },
    });

    const view = render(Host);
    expect(addListener).toHaveBeenCalledWith("resize", expect.any(Function), undefined);
    expect(addListener).toHaveBeenCalledWith("scroll", expect.any(Function), true);

    view.unmount();

    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function), undefined);
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function), true);
  });

  it("positions overlays after animation frame and matches anchor width", async () => {
    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect(this: HTMLElement) {
      if (this.dataset.testid === "anchor") {
        return {
          x: 24,
          y: 32,
          left: 24,
          top: 32,
          right: 264,
          bottom: 64,
          width: 240,
          height: 32,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 180,
        bottom: 80,
        width: 180,
        height: 80,
        toJSON: () => ({}),
      } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(80);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(180);
    let overlay: HTMLElement | null = null;
    const Host = defineComponent({
      setup() {
        const open = ref(true);
        const anchorEl = ref<HTMLElement | null>(null);
        const preferredPlacement = ref<"bottom-start">("bottom-start");
        const motion = useAnchoredOverlay({
          open,
          anchorEl,
          preferredPlacement,
          matchAnchorWidth: true,
        });
        return () => h("div", [
          h("button", { ref: anchorEl, "data-testid": "anchor" }),
          h("div", {
            ref: (element) => {
              motion.overlayEl.value = element instanceof HTMLElement ? element : null;
              overlay = motion.overlayEl.value;
            },
            style: motion.overlayStyle.value,
          }),
        ]);
      },
    });

    render(Host);
    await nextTick();
    await nextTick();
    expect(overlay?.style.width).toBe("");

    expect(frameCallback).not.toBeNull();
    frameCallback?.(0);
    await nextTick();

    expect(overlay?.style.left).toBe("0px");
    expect(overlay?.style.top).toBe("0px");
    expect(overlay?.style.width).toBe("240px");
    expect(overlay?.style.getPropertyValue("translate")).toBe("24px 70px");
  });

  it("cancels pending overlay positioning when closed", async () => {
    let frameCallback: FrameRequestCallback | null = null;
    const requestFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 7;
    });
    const cancelFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 30,
      width: 100,
      height: 30,
      toJSON: () => ({}),
    } as DOMRect);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(40);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
    const open = ref(true);
    let overlay: HTMLElement | null = null;
    const Host = defineComponent({
      setup() {
        const anchorEl = ref<HTMLElement | null>(null);
        const preferredPlacement = ref<"bottom-start">("bottom-start");
        const motion = useAnchoredOverlay({ open, anchorEl, preferredPlacement });
        return () => h("div", [
          h("button", { ref: anchorEl }),
          h("div", {
            ref: (element) => {
              motion.overlayEl.value = element instanceof HTMLElement ? element : null;
              overlay = motion.overlayEl.value;
            },
            style: motion.overlayStyle.value,
          }),
        ]);
      },
    });

    render(Host);
    await nextTick();
    await nextTick();
    expect(requestFrame).toHaveBeenCalled();
    open.value = false;
    await nextTick();

    expect(cancelFrame).toHaveBeenCalledWith(7);
    frameCallback?.(0);
    await nextTick();
    expect(overlay?.style.getPropertyValue("translate")).toBe("");
  });
});

describe("component activation helpers", () => {
  it("invalidates epochs on demand and after unmount", () => {
    let epoch: ComponentEpoch | null = null;
    const Host = defineComponent({
      setup() {
        epoch = withComponentEpoch();
        return () => h("div");
      },
    });

    const view = render(Host);
    const first = epoch?.nextEpoch();
    expect(epoch?.assertAlive(first)).toBe(true);

    epoch?.invalidate();
    expect(epoch?.assertAlive(first)).toBe(false);
    expect(epoch?.assertAlive()).toBe(true);

    view.unmount();
    expect(epoch?.assertAlive()).toBe(false);
  });

  it("focuses and selects the active input after the DOM has updated", async () => {
    const focus = vi.spyOn(HTMLTextAreaElement.prototype, "focus").mockImplementation(() => {});
    const select = vi.spyOn(HTMLTextAreaElement.prototype, "select").mockImplementation(() => {});

    const Host = defineComponent({
      props: { active: Boolean },
      setup(props) {
        const input = ref<HTMLTextAreaElement | null>(null);
        useFocusOnActivation(input, () => props.active, true);
        return () => props.active ? h("textarea", { ref: input }) : h("button", "open");
      },
    });

    const view = render(Host, { props: { active: false } });
    await view.rerender({ active: true });
    await nextTick();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(1);
    focus.mockRestore();
    select.mockRestore();
  });
});

describe("perf utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("cancels a callback queued after animation frame", () => {
    vi.useFakeTimers();
    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const callback = vi.fn();

    const cancel = scheduleAfterPaint(callback);
    frameCallback?.(0);
    cancel();
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });
});
