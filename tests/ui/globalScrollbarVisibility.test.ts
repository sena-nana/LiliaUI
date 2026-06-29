import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installGlobalScrollbarVisibility,
  uninstallGlobalScrollbarVisibility,
} from "@lilia/ui";

function createScroller(input: {
  clientWidth?: number;
  overflowX?: string;
  overflowY?: string;
  scrollHeight?: number;
  scrollWidth?: number;
  scrollTop?: number;
} = {}) {
  const scroller = document.createElement("div");
  let scrollTop = input.scrollTop ?? 0;
  scroller.style.overflowY = input.overflowY ?? "auto";
  scroller.style.overflowX = input.overflowX ?? "hidden";
  Object.defineProperties(scroller, {
    clientHeight: { configurable: true, value: 100 },
    clientWidth: { configurable: true, value: input.clientWidth ?? 200 },
    scrollHeight: { configurable: true, value: input.scrollHeight ?? 400 },
    scrollWidth: { configurable: true, value: input.scrollWidth ?? 200 },
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value) => {
        scrollTop = value;
      },
    },
    scrollLeft: { configurable: true, value: 0 },
  });
  scroller.getBoundingClientRect = () => ({
    top: 10,
    right: 210,
    bottom: 110,
    left: 10,
    width: 200,
    height: 100,
    x: 10,
    y: 10,
    toJSON: () => ({}),
  });
  document.body.appendChild(scroller);
  return {
    element: scroller,
    scrollTop: () => scrollTop,
  };
}

function verticalOverlay() {
  return document.querySelector(".global-scrollbar-overlay--vertical");
}

function horizontalOverlay() {
  return document.querySelector(".global-scrollbar-overlay--horizontal");
}

describe("global scrollbar visibility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    uninstallGlobalScrollbarVisibility();
  });

  afterEach(() => {
    uninstallGlobalScrollbarVisibility();
    vi.useRealTimers();
  });

  it("renders the visible scrollbar as an overlay and removes it after fade-out", () => {
    installGlobalScrollbarVisibility();
    const { element } = createScroller({ scrollTop: 50 });

    element.dispatchEvent(new Event("scroll"));

    const overlay = verticalOverlay();
    expect(overlay).toHaveClass("is-visible");
    expect(overlay).toHaveStyle({ height: "24px" });
    expect(Number.parseFloat((overlay as HTMLElement).style.top)).toBeGreaterThan(10);
    expect(horizontalOverlay()).not.toHaveClass("is-visible");

    vi.advanceTimersByTime(480);
    expect(overlay).not.toHaveClass("is-visible");

    vi.advanceTimersByTime(480);
    expect(verticalOverlay()).toBeNull();

    element.remove();
  });

  it("shows the overlay when hovering over a scrollable edge", () => {
    installGlobalScrollbarVisibility();
    const { element } = createScroller();

    element.dispatchEvent(new MouseEvent("pointermove", {
      bubbles: true,
      clientX: 204,
      clientY: 50,
    }));

    const overlay = verticalOverlay();
    expect(overlay).toHaveClass("is-visible");

    element.dispatchEvent(new MouseEvent("pointermove", {
      bubbles: true,
      clientX: 40,
      clientY: 50,
    }));
    vi.advanceTimersByTime(480);

    expect(overlay).not.toHaveClass("is-visible");

    element.remove();
  });

  it("drags the overlay thumb through a larger hit target", () => {
    installGlobalScrollbarVisibility();
    const { element, scrollTop } = createScroller({ scrollHeight: 500 });
    element.dispatchEvent(new Event("scroll"));

    const overlay = verticalOverlay();
    expect(overlay).toHaveClass("is-visible");

    overlay?.dispatchEvent(new MouseEvent("pointerdown", {
      bubbles: true,
      clientX: 205,
      clientY: 12,
    }));
    window.dispatchEvent(new MouseEvent("pointermove", {
      bubbles: true,
      clientX: 205,
      clientY: 32,
    }));

    expect(scrollTop()).toBeGreaterThan(0);

    window.dispatchEvent(new MouseEvent("pointerup", {
      bubbles: true,
      clientX: 205,
      clientY: 32,
    }));

    element.remove();
  });

  it("keeps independent hide timers for multiple scrolling elements", () => {
    installGlobalScrollbarVisibility();
    const first = createScroller().element;
    const second = createScroller().element;

    first.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(240);
    second.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(239);

    const overlays = () => document.querySelectorAll(".global-scrollbar-overlay--vertical.is-visible");
    expect(overlays()).toHaveLength(2);

    vi.advanceTimersByTime(1);
    expect(overlays()).toHaveLength(1);

    vi.advanceTimersByTime(240);
    expect(overlays()).toHaveLength(0);

    first.remove();
    second.remove();
  });

  it("cleans overlays and timers when uninstalled", () => {
    installGlobalScrollbarVisibility();
    const { element } = createScroller();

    element.dispatchEvent(new Event("scroll"));
    expect(verticalOverlay()).toBeInTheDocument();

    uninstallGlobalScrollbarVisibility();
    expect(verticalOverlay()).toBeNull();

    element.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(480);
    expect(verticalOverlay()).toBeNull();

    element.remove();
  });

  it("does not show a horizontal overlay for truncated text that is not scrollable", () => {
    installGlobalScrollbarVisibility();
    const { element } = createScroller({
      clientWidth: 120,
      overflowX: "hidden",
      overflowY: "hidden",
      scrollHeight: 100,
      scrollWidth: 260,
    });

    element.dispatchEvent(new Event("scroll"));
    element.dispatchEvent(new MouseEvent("pointermove", {
      bubbles: true,
      clientX: 60,
      clientY: 104,
    }));

    expect(verticalOverlay()).toBeNull();
    expect(horizontalOverlay()).toBeNull();

    element.remove();
  });

  it("keeps horizontal overlay hidden for vertical-only scrollers", () => {
    installGlobalScrollbarVisibility();
    const { element } = createScroller({
      overflowX: "hidden",
      overflowY: "auto",
      scrollWidth: 260,
    });

    element.dispatchEvent(new Event("scroll"));

    expect(verticalOverlay()).toHaveClass("is-visible");
    expect(horizontalOverlay()).not.toHaveClass("is-visible");

    element.remove();
  });
});
