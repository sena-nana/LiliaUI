import { onBeforeUnmount, ref, type Ref } from "vue";
import { usePersistentNumber } from "./usePersistentState";

type ResizeEdge = "left" | "right";

export interface ResizablePaneOptions {
  storageKey: string;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  edge: ResizeEdge;
  disabled?: Ref<boolean>;
}

export function useResizablePane(options: ResizablePaneOptions) {
  const clampWidth = (width: number) =>
    Math.min(options.maxWidth, Math.max(options.minWidth, width));

  const width = usePersistentNumber({
    key: options.storageKey,
    defaultValue: options.defaultWidth,
    min: options.minWidth,
    max: options.maxWidth,
  });
  const isResizing = ref(false);

  let startX = 0;
  let startWidth = 0;
  let activePointer: { id: number; target: Element | null } | null = null;
  let pendingClientX: number | null = null;
  let resizeFrame: number | null = null;

  function setWidth(nextWidth: number) {
    width.value = clampWidth(nextWidth);
  }

  function persistWidth() {
    width.value = width.value;
  }

  function resetWidth() {
    width.value = options.defaultWidth;
  }

  function syncWidthFromStorage() {
    try {
      const raw = localStorage.getItem(options.storageKey);
      const value = raw ? Number.parseFloat(raw) : NaN;
      width.value = Number.isFinite(value) ? clampWidth(value) : options.defaultWidth;
    } catch {
      width.value = options.defaultWidth;
    }
  }

  function setWidthFromClientX(clientX: number) {
    const delta = options.edge === "left"
      ? startX - clientX
      : clientX - startX;
    setWidth(startWidth + delta);
  }

  function flushPendingResize() {
    if (resizeFrame != null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = null;
    if (pendingClientX == null) return;
    const clientX = pendingClientX;
    pendingClientX = null;
    setWidthFromClientX(clientX);
  }

  function onPointerMove(event: PointerEvent) {
    pendingClientX = event.clientX;
    if (typeof requestAnimationFrame !== "function") {
      flushPendingResize();
      return;
    }
    if (resizeFrame != null) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      flushPendingResize();
    });
  }

  function releasePointerCapture() {
    if (!activePointer?.target?.hasPointerCapture?.(activePointer.id)) return;
    activePointer.target.releasePointerCapture(activePointer.id);
  }

  function removeResizeListeners() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);
    window.removeEventListener("blur", stopResize);
  }

  function stopResize() {
    if (!isResizing.value) return;
    isResizing.value = false;
    removeResizeListeners();
    flushPendingResize();
    releasePointerCapture();
    activePointer = null;
    persistWidth();
  }

  function onPointerEnd(event: PointerEvent) {
    if (activePointer && event.pointerId !== activePointer.id) return;
    stopResize();
  }

  function startResize(event: PointerEvent) {
    if (options.disabled?.value || event.button !== 0) return;
    event.preventDefault();
    isResizing.value = true;
    startX = event.clientX;
    startWidth = width.value;
    pendingClientX = null;
    resizeFrame = null;
    const target = event.currentTarget instanceof Element ? event.currentTarget : null;
    target?.setPointerCapture?.(event.pointerId);
    activePointer = { id: event.pointerId, target };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("blur", stopResize);
  }

  onBeforeUnmount(() => {
    stopResize();
  });

  return {
    width,
    isResizing,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    setWidth,
    persistWidth,
    resetWidth,
    syncWidthFromStorage,
    startResize,
  };
}
