import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";
import type { DialogProps } from "@lilia/ui-contract";
import { getFocusableElements, moveFocusWithin } from "./focus";

export interface DialogPrimitive {
  onKeydown: (event: KeyboardEvent) => void;
  onOutsidePointer: (event: MouseEvent) => void;
}

export function useDialogPrimitive(
  props: Pick<DialogProps, "open" | "closeOnEscape" | "closeOnOutside" | "initialFocus">,
  root: Ref<HTMLElement | null>,
  close: () => void,
  initialFocusTarget?: () => HTMLElement | null,
): DialogPrimitive {
  let returnTarget: HTMLElement | null = null;
  let epoch = 0;

  watch(() => props.open, (open) => {
    epoch += 1;
    const currentEpoch = epoch;
    if (open) {
      returnTarget = typeof document === "undefined" ? null : document.activeElement as HTMLElement | null;
      void nextTick(() => {
        if (!props.open || currentEpoch !== epoch) return;
        const first = initialFocusTarget?.() ?? getFocusableElements(root.value)[0];
        (props.initialFocus === "dialog" ? root.value : first ?? root.value)?.focus();
      });
      return;
    }
    restoreFocus();
  }, { immediate: true });

  onBeforeUnmount(restoreFocus);

  function restoreFocus() {
    const target = returnTarget;
    returnTarget = null;
    if (target?.isConnected) void nextTick(() => target.focus());
  }

  return {
    onKeydown(event) {
      if (event.key === "Escape" && props.closeOnEscape !== false) {
        event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        event.preventDefault();
        moveFocusWithin(root.value, event.shiftKey);
      }
    },
    onOutsidePointer(event) {
      if (props.closeOnOutside !== false && event.target === root.value) close();
    },
  };
}
