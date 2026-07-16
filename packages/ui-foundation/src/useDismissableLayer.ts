import { onBeforeUnmount, watch, type Ref } from "vue";

export interface DismissableLayerOptions {
  open: Ref<boolean>;
  root: Ref<HTMLElement | null>;
  trigger?: Ref<HTMLElement | null>;
  close: () => void;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
}

export function useDismissableLayer(options: DismissableLayerOptions): void {
  let active = false;
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (
      options.closeOnOutside === false ||
      !target ||
      options.root.value?.contains(target) ||
      options.trigger?.value?.contains(target)
    ) return;
    options.close();
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && options.closeOnEscape !== false) options.close();
  };
  const detach = () => {
    if (!active || typeof document === "undefined") return;
    active = false;
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeydown, true);
  };
  const attach = () => {
    if (active || typeof document === "undefined") return;
    active = true;
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeydown, true);
  };
  watch(options.open, (open) => open ? attach() : detach(), { immediate: true });
  onBeforeUnmount(detach);
}
