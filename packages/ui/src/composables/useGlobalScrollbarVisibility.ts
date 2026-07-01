type Axis = "vertical" | "horizontal";

type ScrollTarget = {
  key: Element;
  scroller: Element | Window;
};

type ScrollMetrics = {
  clientHeight: number;
  clientWidth: number;
  rect: Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
};

type ThumbMetrics = {
  domainSize: number;
  thumbOffset: number;
  thumbSize: number;
  trackSize: number;
  visibleSize: number;
};

type OverlayPair = {
  horizontal: HTMLDivElement;
  vertical: HTMLDivElement;
};

type OverlayBinding = {
  axis: Axis;
  target: ScrollTarget;
};

type OverflowState = {
  horizontal: boolean;
  vertical: boolean;
};

type MetricsSnapshot = {
  metrics: ScrollMetrics;
  overflow: OverflowState;
};

type PointerSnapshot = {
  clientX: number;
  clientY: number;
  path: EventTarget[];
};

type RegisteredTarget = {
  cleanup: () => void;
  target: ScrollTarget;
};

type DragState = OverlayBinding & {
  metrics: ThumbMetrics;
  pointerId: number | null;
  startPointer: number;
  startScroll: number;
};

const HIDE_DELAY = 480;
const HOT_ZONE = 12;
const TRACK_PADDING = 4;
const MIN_THUMB_SIZE = 24;

let installed = false;
let hoverTarget: ScrollTarget | null = null;
let dragState: DragState | null = null;
let overlayUpdateFrame: number | null = null;
let pointerMoveFrame: number | null = null;
let pendingPointerMove: PointerSnapshot | null = null;
let dragScrollFrame: number | null = null;
let pendingDragPointer: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let scrollbarStylesLoaded = false;

function loadGlobalScrollbarStyles() {
  if (scrollbarStylesLoaded || typeof window === "undefined") return;
  scrollbarStylesLoaded = true;
  void import("../styles/global-scrollbar.css");
}

const hideTimers = new WeakMap<Element, ReturnType<typeof window.setTimeout>>();
const removeTimers = new WeakMap<Element, ReturnType<typeof window.setTimeout>>();
const overlays = new Map<Element, OverlayPair>();
const overlayBindings = new WeakMap<HTMLDivElement, OverlayBinding>();
const pendingOverlayTargets = new Map<Element, ScrollTarget>();
const registeredTargets = new Map<Element, RegisteredTarget>();
const metricsCache = new WeakMap<Element, MetricsSnapshot>();
const dirtyMetricsTargets = new WeakSet<Element>();
const localOverlayHostPositions = new WeakMap<HTMLElement, string>();

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function maxScroll(domainSize: number, visibleSize: number): number {
  return Math.max(0, domainSize - visibleSize);
}

function thumbMetrics(input: {
  domainSize: number;
  scrollOffset: number;
  trackSize: number;
  visibleSize: number;
}): ThumbMetrics {
  const visibleSize = Math.max(0, input.visibleSize);
  const domainSize = Math.max(visibleSize, input.domainSize);
  const trackSize = Math.max(0, input.trackSize);
  const scrollOffset = clamp(input.scrollOffset, 0, maxScroll(domainSize, visibleSize));
  const proportionalSize = domainSize > 0 ? (trackSize * visibleSize) / domainSize : 0;
  const thumbSize =
    domainSize - visibleSize > 1
      ? Math.min(trackSize, Math.max(MIN_THUMB_SIZE, proportionalSize))
      : 0;
  const thumbTrackSize = Math.max(0, trackSize - thumbSize);

  return {
    domainSize,
    thumbOffset:
      thumbSize > 0
        ? (thumbTrackSize * scrollOffset) / Math.max(1, maxScroll(domainSize, visibleSize))
        : 0,
    thumbSize,
    trackSize,
    visibleSize,
  };
}

function dragScrollOffset(startScroll: number, pointerDelta: number, metrics: ThumbMetrics): number {
  const scrollRange = maxScroll(metrics.domainSize, metrics.visibleSize);
  const thumbTrackSize = Math.max(1, metrics.trackSize - metrics.thumbSize);
  return clamp(startScroll + (pointerDelta * scrollRange) / thumbTrackSize, 0, scrollRange);
}

function eventPath(event: Event): EventTarget[] {
  return typeof event.composedPath === "function" ? event.composedPath() : [event.target].filter(Boolean) as EventTarget[];
}

function resolveTarget(target: EventTarget | null): ScrollTarget | null {
  if (typeof document === "undefined") return null;
  if (
    target === window ||
    target === document ||
    target === document.documentElement ||
    target === document.body
  ) {
    return { key: document.documentElement, scroller: window };
  }
  return target instanceof Element ? { key: target, scroller: target } : null;
}

function readScrollOffsets(target: ScrollTarget) {
  if (target.scroller === window) {
    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      scrollLeft: scroller.scrollLeft || window.scrollX,
      scrollTop: scroller.scrollTop || window.scrollY,
    };
  }

  const element = target.scroller as Element;
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
  };
}

function readMetrics(target: ScrollTarget): ScrollMetrics {
  const offsets = readScrollOffsets(target);
  if (target.scroller === window) {
    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      clientHeight: window.innerHeight,
      clientWidth: window.innerWidth,
      rect: {
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollHeight: scroller.scrollHeight,
      scrollLeft: offsets.scrollLeft,
      scrollTop: offsets.scrollTop,
      scrollWidth: scroller.scrollWidth,
    };
  }

  const element = target.scroller as Element;
  const rect = element.getBoundingClientRect();
  return {
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth,
    rect,
    scrollHeight: element.scrollHeight,
    scrollLeft: offsets.scrollLeft,
    scrollTop: offsets.scrollTop,
    scrollWidth: element.scrollWidth,
  };
}

function hasScrollableOverflow(target: ScrollTarget, metrics: ScrollMetrics, axis: Axis): boolean {
  const hasOverflow =
    axis === "vertical"
      ? metrics.scrollHeight > metrics.clientHeight + 1
      : metrics.scrollWidth > metrics.clientWidth + 1;
  if (!hasOverflow) return false;
  if (target.scroller === window) return true;
  const style = window.getComputedStyle(target.scroller as Element);
  const overflow = axis === "vertical" ? style.overflowY : style.overflowX;
  return overflow === "auto" || overflow === "scroll";
}

function overflowState(target: ScrollTarget, metrics: ScrollMetrics): OverflowState {
  return {
    horizontal: hasScrollableOverflow(target, metrics, "horizontal"),
    vertical: hasScrollableOverflow(target, metrics, "vertical"),
  };
}

function currentMetrics(target: ScrollTarget, forceMeasure = false): MetricsSnapshot {
  const cached = metricsCache.get(target.key);
  if (!forceMeasure && cached && !dirtyMetricsTargets.has(target.key)) {
    const offsets = readScrollOffsets(target);
    return {
      ...cached,
      metrics: {
        ...cached.metrics,
        scrollLeft: offsets.scrollLeft,
        scrollTop: offsets.scrollTop,
      },
    };
  }

  dirtyMetricsTargets.delete(target.key);
  const metrics = readMetrics(target);
  const snapshot = { metrics, overflow: overflowState(target, metrics) };
  metricsCache.set(target.key, snapshot);
  return snapshot;
}

function inHotZone(
  metrics: ScrollMetrics,
  overflow: OverflowState,
  pointer: Pick<PointerEvent, "clientX" | "clientY">,
): boolean {
  const { clientX, clientY } = pointer;
  if (
    clientX < metrics.rect.left ||
    clientX > metrics.rect.right ||
    clientY < metrics.rect.top ||
    clientY > metrics.rect.bottom
  ) {
    return false;
  }

  return (
    (overflow.vertical && clientX >= metrics.rect.right - HOT_ZONE) ||
    (overflow.horizontal && clientY >= metrics.rect.bottom - HOT_ZONE)
  );
}

function isPointerLikeEvent(event: Event): event is PointerEvent {
  return "clientX" in event && "clientY" in event;
}

function clearTimer(map: WeakMap<Element, ReturnType<typeof window.setTimeout>>, target: Element) {
  const timer = map.get(target);
  if (timer === undefined) return;
  window.clearTimeout(timer);
  map.delete(target);
}

function prepareLocalOverlayHost(target: ScrollTarget) {
  if (!(target.scroller instanceof HTMLElement)) return;
  if (localOverlayHostPositions.has(target.scroller)) return;
  if (window.getComputedStyle(target.scroller).position !== "static") return;
  localOverlayHostPositions.set(target.scroller, target.scroller.style.position);
  target.scroller.style.position = "relative";
}

function restoreLocalOverlayHost(target: Element) {
  if (!(target instanceof HTMLElement) || !localOverlayHostPositions.has(target)) return;
  target.style.position = localOverlayHostPositions.get(target) ?? "";
  localOverlayHostPositions.delete(target);
}

function removeOverlay(target: Element) {
  const overlay = overlays.get(target);
  pendingOverlayTargets.delete(target);
  if (!overlay) return;
  overlayBindings.delete(overlay.vertical);
  overlayBindings.delete(overlay.horizontal);
  overlay.vertical.remove();
  overlay.horizontal.remove();
  overlays.delete(target);
}

function ensureOverlay(target: ScrollTarget): OverlayPair {
  const existing = overlays.get(target.key);
  if (existing) return existing;

  const overlay = {
    vertical: document.createElement("div"),
    horizontal: document.createElement("div"),
  };
  overlay.vertical.className = "global-scrollbar-overlay global-scrollbar-overlay--vertical";
  overlay.horizontal.className = "global-scrollbar-overlay global-scrollbar-overlay--horizontal";
  if (target.scroller !== window) {
    overlay.vertical.classList.add("global-scrollbar-overlay--local");
    overlay.horizontal.classList.add("global-scrollbar-overlay--local");
  }
  overlayBindings.set(overlay.vertical, { axis: "vertical", target });
  overlayBindings.set(overlay.horizontal, { axis: "horizontal", target });
  overlay.vertical.addEventListener("pointerdown", onOverlayPointerDown);
  overlay.horizontal.addEventListener("pointerdown", onOverlayPointerDown);
  if (target.scroller === window) {
    document.body.append(overlay.vertical, overlay.horizontal);
  } else {
    prepareLocalOverlayHost(target);
    target.key.append(overlay.vertical, overlay.horizontal);
  }
  overlays.set(target.key, overlay);
  return overlay;
}

function setVisible(element: HTMLDivElement, visible: boolean) {
  element.classList.toggle("is-visible", visible);
}

function updateLocalOverlayAxis(
  element: HTMLDivElement,
  axis: Axis,
  metrics: ScrollMetrics,
  visible: boolean,
) {
  setVisible(element, visible);
  if (!visible) return;

  const vertical = axis === "vertical";
  const thumb = thumbMetrics({
    domainSize: vertical ? metrics.scrollHeight : metrics.scrollWidth,
    scrollOffset: vertical ? metrics.scrollTop : metrics.scrollLeft,
    trackSize: Math.max(0, (vertical ? metrics.clientHeight : metrics.clientWidth) - TRACK_PADDING * 2),
    visibleSize: vertical ? metrics.clientHeight : metrics.clientWidth,
  });

  element.style.top = "0";
  element.style.right = "";
  element.style.bottom = "";
  element.style.left = "0";
  if (vertical) {
    element.style.height = `${thumb.thumbSize}px`;
    element.style.width = "";
    element.style.transform = `translate3d(${metrics.scrollLeft + metrics.clientWidth - HOT_ZONE}px, ${metrics.scrollTop + TRACK_PADDING + thumb.thumbOffset}px, 0)`;
    return;
  }

  element.style.width = `${thumb.thumbSize}px`;
  element.style.height = "";
  element.style.transform = `translate3d(${metrics.scrollLeft + TRACK_PADDING + thumb.thumbOffset}px, ${metrics.scrollTop + metrics.clientHeight - HOT_ZONE}px, 0)`;
}

function updateFixedOverlayAxis(
  element: HTMLDivElement,
  axis: Axis,
  metrics: ScrollMetrics,
  visible: boolean,
) {
  setVisible(element, visible);
  if (!visible) return;

  const vertical = axis === "vertical";
  const thumb = thumbMetrics({
    domainSize: vertical ? metrics.scrollHeight : metrics.scrollWidth,
    scrollOffset: vertical ? metrics.scrollTop : metrics.scrollLeft,
    trackSize: Math.max(0, (vertical ? metrics.rect.height : metrics.rect.width) - TRACK_PADDING * 2),
    visibleSize: vertical ? metrics.clientHeight : metrics.clientWidth,
  });

  if (vertical) {
    element.style.top = "0";
    element.style.right = `${Math.max(0, window.innerWidth - metrics.rect.right)}px`;
    element.style.bottom = "";
    element.style.left = "";
    element.style.height = `${thumb.thumbSize}px`;
    element.style.width = "";
    element.style.transform = `translate3d(0, ${metrics.rect.top + TRACK_PADDING + thumb.thumbOffset}px, 0)`;
    return;
  }

  element.style.top = "";
  element.style.right = "";
  element.style.bottom = `${Math.max(0, window.innerHeight - metrics.rect.bottom)}px`;
  element.style.left = "0";
  element.style.width = `${thumb.thumbSize}px`;
  element.style.height = "";
  element.style.transform = `translate3d(${metrics.rect.left + TRACK_PADDING + thumb.thumbOffset}px, 0, 0)`;
}

function updateOverlay(target: ScrollTarget) {
  const { metrics, overflow } = currentMetrics(target);
  if (!overflow.vertical && !overflow.horizontal) {
    removeOverlay(target.key);
    return;
  }

  clearTimer(removeTimers, target.key);
  const overlay = ensureOverlay(target);
  const updateAxis = target.scroller === window ? updateFixedOverlayAxis : updateLocalOverlayAxis;
  updateAxis(overlay.vertical, "vertical", metrics, overflow.vertical);
  updateAxis(overlay.horizontal, "horizontal", metrics, overflow.horizontal);
}

function flushOverlayUpdates() {
  overlayUpdateFrame = null;
  const targets = [...pendingOverlayTargets.values()];
  pendingOverlayTargets.clear();
  for (const target of targets) updateOverlay(target);
}

function scheduleOverlayUpdate(target: ScrollTarget) {
  pendingOverlayTargets.set(target.key, target);
  if (overlayUpdateFrame !== null) return;
  overlayUpdateFrame = window.requestAnimationFrame(flushOverlayUpdates);
}

function cancelPointerMoveFrame() {
  if (pointerMoveFrame === null) return;
  window.cancelAnimationFrame(pointerMoveFrame);
  pointerMoveFrame = null;
  pendingPointerMove = null;
}

function cancelDragScrollFrame() {
  if (dragScrollFrame === null) return;
  window.cancelAnimationFrame(dragScrollFrame);
  dragScrollFrame = null;
  pendingDragPointer = null;
}

function hideOverlay(target: Element) {
  const overlay = overlays.get(target);
  if (!overlay) return;
  overlay.vertical.classList.remove("is-visible");
  overlay.horizontal.classList.remove("is-visible");
  clearTimer(removeTimers, target);
  removeTimers.set(
    target,
    window.setTimeout(() => {
      removeOverlay(target);
      removeTimers.delete(target);
    }, HIDE_DELAY),
  );
}

function hideSoon(target: ScrollTarget) {
  clearTimer(hideTimers, target.key);
  hideTimers.set(
    target.key,
    window.setTimeout(() => {
      hideOverlay(target.key);
      hideTimers.delete(target.key);
    }, HIDE_DELAY),
  );
}

function show(target: ScrollTarget) {
  clearTimer(hideTimers, target.key);
  clearTimer(removeTimers, target.key);
  scheduleOverlayUpdate(target);
}

function showImmediately(target: ScrollTarget) {
  clearTimer(hideTimers, target.key);
  clearTimer(removeTimers, target.key);
  updateOverlay(target);
}

function axisMetrics(target: ScrollTarget, axis: Axis) {
  const { metrics } = currentMetrics(target, true);
  const vertical = axis === "vertical";
  return {
    metrics,
    thumb: thumbMetrics({
      domainSize: vertical ? metrics.scrollHeight : metrics.scrollWidth,
      scrollOffset: vertical ? metrics.scrollTop : metrics.scrollLeft,
      trackSize: Math.max(0, (vertical ? metrics.clientHeight : metrics.clientWidth) - TRACK_PADDING * 2),
      visibleSize: vertical ? metrics.clientHeight : metrics.clientWidth,
    }),
  };
}

function setScroll(target: ScrollTarget, axis: Axis, value: number) {
  const offsets = readScrollOffsets(target);
  if (target.scroller === window) {
    window.scrollTo(
      axis === "horizontal" ? value : offsets.scrollLeft,
      axis === "vertical" ? value : offsets.scrollTop,
    );
    return;
  }

  const element = target.scroller as Element;
  if (axis === "vertical") element.scrollTop = value;
  else element.scrollLeft = value;
}

function registerTarget(target: ScrollTarget): ScrollTarget {
  const existing = registeredTargets.get(target.key);
  if (existing) return existing.target;

  currentMetrics(target, true);
  const onTargetScroll = () => {
    show(target);
    hideSoon(target);
  };
  if (target.scroller === window) {
    window.addEventListener("scroll", onTargetScroll, { passive: true });
  } else {
    target.scroller.addEventListener("scroll", onTargetScroll, { passive: true });
    resizeObserver?.observe(target.key);
  }

  registeredTargets.set(target.key, {
    target,
    cleanup: () => {
      if (target.scroller === window) {
        window.removeEventListener("scroll", onTargetScroll);
      } else {
        target.scroller.removeEventListener("scroll", onTargetScroll);
        resizeObserver?.unobserve(target.key);
      }
      restoreLocalOverlayHost(target.key);
    },
  });
  return target;
}

function scrollTargetFromPath(path: EventTarget[], pointer?: Pick<PointerEvent, "clientX" | "clientY">): ScrollTarget | null {
  for (const node of path) {
    const target = resolveTarget(node);
    if (!target) continue;
    const { metrics, overflow } = currentMetrics(target, true);
    if (!overflow.vertical && !overflow.horizontal) continue;
    if (pointer && !inHotZone(metrics, overflow, pointer)) continue;
    return registerTarget(target);
  }

  const documentTarget = resolveTarget(document);
  if (!documentTarget) return null;
  const { metrics, overflow } = currentMetrics(documentTarget, true);
  if (!overflow.vertical && !overflow.horizontal) return null;
  if (pointer && !inHotZone(metrics, overflow, pointer)) return null;
  return registerTarget(documentTarget);
}

function scrollTargetFromEvent(event: Event, options: { hotZone?: boolean } = {}): ScrollTarget | null {
  if (!options.hotZone) return scrollTargetFromPath(eventPath(event));
  return isPointerLikeEvent(event) ? scrollTargetFromPath(eventPath(event), event) : null;
}

function onOverlayPointerDown(event: PointerEvent) {
  const binding = overlayBindings.get(event.currentTarget as HTMLDivElement);
  if (!binding) return;

  const { metrics, thumb } = axisMetrics(binding.target, binding.axis);
  const vertical = binding.axis === "vertical";
  event.preventDefault();
  event.stopPropagation();
  show(binding.target);
  dragState = {
    ...binding,
    metrics: thumb,
    pointerId: Number.isFinite(event.pointerId) ? event.pointerId : null,
    startPointer: vertical ? event.clientY : event.clientX,
    startScroll: vertical ? metrics.scrollTop : metrics.scrollLeft,
  };
  window.addEventListener("pointermove", onDragPointerMove, { capture: true });
  window.addEventListener("pointerup", onDragPointerEnd, true);
  window.addEventListener("pointercancel", onDragPointerEnd, true);
}

function flushDragPointerMove() {
  dragScrollFrame = null;
  if (!dragState || pendingDragPointer === null) return;
  const pointer = pendingDragPointer;
  pendingDragPointer = null;
  setScroll(
    dragState.target,
    dragState.axis,
    dragScrollOffset(dragState.startScroll, pointer - dragState.startPointer, dragState.metrics),
  );
  show(dragState.target);
}

function onDragPointerMove(event: PointerEvent) {
  if (!dragState || (dragState.pointerId !== null && event.pointerId !== dragState.pointerId)) return;
  event.preventDefault();
  pendingDragPointer = dragState.axis === "vertical" ? event.clientY : event.clientX;
  if (dragScrollFrame !== null) return;
  dragScrollFrame = window.requestAnimationFrame(flushDragPointerMove);
}

function onDragPointerEnd(event: PointerEvent) {
  if (!dragState || (dragState.pointerId !== null && event.pointerId !== dragState.pointerId)) return;
  const target = dragState.target;
  if (dragScrollFrame !== null) {
    window.cancelAnimationFrame(dragScrollFrame);
    flushDragPointerMove();
  }
  dragState = null;
  hideSoon(target);
  window.removeEventListener("pointermove", onDragPointerMove, true);
  window.removeEventListener("pointerup", onDragPointerEnd, true);
  window.removeEventListener("pointercancel", onDragPointerEnd, true);
}

function onPointerOver(event: PointerEvent) {
  scrollTargetFromEvent(event);
}

function onPointerMove(event: PointerEvent) {
  if (dragState) return;
  pendingPointerMove = {
    clientX: event.clientX,
    clientY: event.clientY,
    path: eventPath(event),
  };
  if (pointerMoveFrame !== null) return;
  pointerMoveFrame = window.requestAnimationFrame(flushPointerMove);
}

function flushPointerMove() {
  pointerMoveFrame = null;
  const snapshot = pendingPointerMove;
  pendingPointerMove = null;
  if (!snapshot || dragState) return;

  const target = scrollTargetFromPath(snapshot.path, snapshot);
  if (target) {
    if (hoverTarget?.key && hoverTarget.key !== target.key) hideSoon(hoverTarget);
    hoverTarget = target;
    showImmediately(target);
    return;
  }

  if (hoverTarget) {
    hideSoon(hoverTarget);
    hoverTarget = null;
  }
}

function onWheel(event: WheelEvent) {
  const target = scrollTargetFromEvent(event);
  if (!target) return;
  show(target);
  hideSoon(target);
}

function onTouchStart(event: TouchEvent) {
  const target = scrollTargetFromEvent(event);
  if (!target) return;
  show(target);
  hideSoon(target);
}

function onFocusIn(event: FocusEvent) {
  scrollTargetFromEvent(event);
}

function onPointerLeave() {
  if (!hoverTarget) return;
  hideSoon(hoverTarget);
  hoverTarget = null;
}

function onWindowResize() {
  for (const key of registeredTargets.keys()) {
    dirtyMetricsTargets.add(key);
  }
  for (const { target } of registeredTargets.values()) {
    if (overlays.has(target.key)) scheduleOverlayUpdate(target);
  }
}

export function uninstallGlobalScrollbarVisibility() {
  if (!installed || typeof window === "undefined") return;
  installed = false;
  if (overlayUpdateFrame !== null) {
    window.cancelAnimationFrame(overlayUpdateFrame);
    overlayUpdateFrame = null;
  }
  cancelPointerMoveFrame();
  cancelDragScrollFrame();
  pendingOverlayTargets.clear();
  window.removeEventListener("pointerover", onPointerOver);
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointermove", onDragPointerMove, true);
  window.removeEventListener("pointerleave", onPointerLeave);
  window.removeEventListener("pointerup", onDragPointerEnd, true);
  window.removeEventListener("pointercancel", onDragPointerEnd, true);
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("focusin", onFocusIn);
  window.removeEventListener("resize", onWindowResize);
  hoverTarget = null;
  dragState = null;
  registeredTargets.forEach((registered) => {
    clearTimer(hideTimers, registered.target.key);
    clearTimer(removeTimers, registered.target.key);
    registered.cleanup();
  });
  registeredTargets.clear();
  overlays.forEach((_overlay, target) => {
    removeOverlay(target);
  });
  resizeObserver?.disconnect();
  resizeObserver = null;
}

export function installGlobalScrollbarVisibility() {
  if (installed || typeof window === "undefined") return uninstallGlobalScrollbarVisibility;
  loadGlobalScrollbarStyles();
  installed = true;
  resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        dirtyMetricsTargets.add(entry.target);
        const registered = registeredTargets.get(entry.target);
        if (registered && overlays.has(entry.target)) {
          scheduleOverlayUpdate(registered.target);
        }
      }
    })
    : null;
  window.addEventListener("pointerover", onPointerOver, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("focusin", onFocusIn);
  window.addEventListener("resize", onWindowResize);
  return uninstallGlobalScrollbarVisibility;
}
