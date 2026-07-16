import { nextTick, onBeforeUnmount, ref, watch, type Ref } from "vue";

export type AnchorPlacement = "top" | "right" | "bottom" | "left";

export interface AnchoredPositionOptions {
  open: Ref<boolean>;
  anchor: Ref<HTMLElement | null>;
  surface: Ref<HTMLElement | null>;
  placement: Ref<AnchorPlacement>;
  gap?: number;
  viewportPadding?: number;
}

export function useAnchoredPosition(options: AnchoredPositionOptions) {
  const style = ref<Record<string, string>>({});
  const update = () => {
    if (typeof window === "undefined") return;
    const anchor = options.anchor.value;
    const surface = options.surface.value;
    if (!anchor || !surface) return;
    const a = anchor.getBoundingClientRect();
    const s = surface.getBoundingClientRect();
    const gap = options.gap ?? 8;
    const pad = options.viewportPadding ?? 8;
    let left = a.left + (a.width - s.width) / 2;
    let top = a.bottom + gap;
    if (options.placement.value === "top") top = a.top - s.height - gap;
    if (options.placement.value === "left") {
      left = a.left - s.width - gap;
      top = a.top + (a.height - s.height) / 2;
    }
    if (options.placement.value === "right") {
      left = a.right + gap;
      top = a.top + (a.height - s.height) / 2;
    }
    left = Math.min(Math.max(left, pad), window.innerWidth - s.width - pad);
    top = Math.min(Math.max(top, pad), window.innerHeight - s.height - pad);
    style.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` };
  };
  const detach = () => {
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", update);
    window.removeEventListener("scroll", update, true);
  };
  const attach = () => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    void nextTick(update);
  };
  watch([options.open, options.placement], ([open]) => {
    detach();
    if (open) attach();
  }, { immediate: true });
  onBeforeUnmount(detach);
  return { style, update };
}
