import { computed, ref, type ComputedRef, type Ref } from "vue";
import {
  type AnchoredMenuPlacement,
  type MenuPlacement,
} from "./menuMotion";
import { useAnchoredOverlay } from "./useAnchoredOverlay";

interface AnchorPoint {
  x: number;
  y: number;
}

function resolveAnchorFromEvent(
  event: MouseEvent,
  triggerRect: DOMRect,
  placement: MenuPlacement,
): AnchorPoint {
  return {
    x:
      Number.isFinite(event.clientX) && event.clientX > 0
        ? event.clientX
        : triggerRect.left + triggerRect.width / 2,
    y:
      Number.isFinite(event.clientY) && event.clientY > 0
        ? event.clientY
        : placement === "bottom"
          ? triggerRect.bottom
          : triggerRect.top,
  };
}

export function useAnchoredMenuMotion(
  open: Ref<boolean>,
  placement: Ref<MenuPlacement>,
  matchAnchorWidth?: Ref<boolean> | ComputedRef<boolean>,
) {
  const triggerEl = ref<HTMLElement | null>(null);
  const anchorEl = computed(() => triggerEl.value);
  const preferredPlacement = computed<AnchoredMenuPlacement>(
    () => `${placement.value}-start` as AnchoredMenuPlacement,
  );
  const {
    overlayEl: menuEl,
    overlayStyle,
    resolvedPlacement,
    setAnchorPoint,
    updatePosition,
    containsTarget,
  } = useAnchoredOverlay({
    open,
    anchorEl,
    preferredPlacement,
    offset: 6,
    matchAnchorWidth,
  });

  function captureAnchor(event: MouseEvent) {
    const trigger = anchorEl.value;
    if (!trigger) return;
    setAnchorPoint(resolveAnchorFromEvent(event, trigger.getBoundingClientRect(), placement.value));
  }

  return {
    triggerEl,
    menuEl,
    overlayStyle,
    resolvedPlacement,
    containsTarget,
    clearAnchor: () => setAnchorPoint(null),
    captureAnchor,
    updateOrigin: updatePosition,
    updatePosition,
  };
}
