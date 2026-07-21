import { ref } from "vue";
import {
  createAnchoredMenuPosition,
  type AnchoredMenuPosition,
} from "./menuMotion";
import { useDismissableLayer } from "@lilia/ui-foundation/overlay";

const MENU_SELECTOR = ".sb-menu";

export function useAnchoredActionMenu() {
  const open = ref(false);
  const position = ref<AnchoredMenuPosition>(createAnchoredMenuPosition(0, 0));

  function openAtEvent(event: MouseEvent) {
    position.value = createAnchoredMenuPosition(
      event.clientX,
      event.clientY,
      event.clientX,
      event.clientY,
    );
    open.value = true;
  }

  function close() {
    open.value = false;
  }

  function containsMenuTarget(target: EventTarget | null) {
    const element = target as HTMLElement | null;
    return Boolean(element?.closest?.(MENU_SELECTOR));
  }

  useDismissableLayer({
    open,
    closeOnOutside: true,
    closeOnEscape: true,
    containsTarget: containsMenuTarget,
    stopEscapePropagation: true,
    close,
  });

  return {
    close,
    open,
    openAtEvent,
    position,
  };
}
