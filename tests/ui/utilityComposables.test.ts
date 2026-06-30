import { render } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDomEventListener,
  createLazyLoadState,
  installCombinedUnlisten,
  installUnlistenFns,
  scheduleAfterPaint,
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
