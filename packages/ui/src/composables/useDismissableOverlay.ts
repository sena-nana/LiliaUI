import {
  nextTick,
  onBeforeUnmount,
  unref,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import { addDomEventListener, runUnlistenFns } from "../utils/eventListeners";

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

export interface DismissableOverlayOptions {
  closeOnEscape?: MaybeRef<boolean>;
  closeOnOutside?: MaybeRef<boolean>;
  containsTarget?: (target: EventTarget | null) => boolean;
  onDismiss: (event: Event) => void;
  open: Ref<boolean> | ComputedRef<boolean>;
  stopEscapePropagation?: boolean;
}

function valueOf<T>(value: MaybeRef<T> | undefined, defaultValue: T): T {
  return value === undefined ? defaultValue : unref(value);
}

export function useDismissableOverlay(options: DismissableOverlayOptions) {
  let listenerSeq = 0;
  let documentUnlisteners: Array<() => void> = [];

  function clearDocumentListeners() {
    runUnlistenFns(documentUnlisteners.splice(0).reverse());
  }

  function onDocPointer(event: PointerEvent) {
    if (!valueOf(options.closeOnOutside, true)) return;
    if (options.containsTarget?.(event.target) ?? false) return;
    options.onDismiss(event);
  }

  function onDocKey(event: KeyboardEvent) {
    if (!valueOf(options.closeOnEscape, true)) return;
    if (event.key !== "Escape" || !options.open.value) return;
    options.onDismiss(event);
    if (valueOf(options.stopEscapePropagation, true)) {
      event.stopPropagation();
    }
  }

  function installDocumentListeners() {
    clearDocumentListeners();
    const unlisteners: Array<() => void> = [];
    if (valueOf(options.closeOnOutside, true)) {
      unlisteners.push(addDomEventListener(document, "pointerdown", onDocPointer, true));
    }
    if (valueOf(options.closeOnEscape, true)) {
      unlisteners.push(addDomEventListener(document, "keydown", onDocKey));
    }
    documentUnlisteners = unlisteners;
  }

  watch(
    () => [
      options.open.value,
      valueOf(options.closeOnOutside, true),
      valueOf(options.closeOnEscape, true),
    ] as const,
    async ([open, closeOnOutside, closeOnEscape]) => {
      const seq = ++listenerSeq;
      clearDocumentListeners();
      if (!open || (!closeOnOutside && !closeOnEscape)) return;

      await nextTick();
      if (seq !== listenerSeq || !options.open.value) return;
      installDocumentListeners();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    listenerSeq += 1;
    clearDocumentListeners();
  });
}
