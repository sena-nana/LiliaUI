import { nextTick, onBeforeUnmount, unref, watch, type ComputedRef, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

export interface DismissableLayerOptions {
  open: Ref<boolean> | ComputedRef<boolean>;
  root?: Ref<HTMLElement | null>;
  trigger?: Ref<HTMLElement | null>;
  containsTarget?: (target: EventTarget | null) => boolean;
  close: () => void;
  closeOnEscape?: MaybeRef<boolean>;
  closeOnOutside?: MaybeRef<boolean>;
  stopEscapePropagation?: MaybeRef<boolean>;
}

function valueOf<T>(value: MaybeRef<T> | undefined, defaultValue: T): T {
  return value === undefined ? defaultValue : unref(value);
}

export function useDismissableLayer(options: DismissableLayerOptions): void {
  let listenerSeq = 0;
  let documentUnlisteners: Array<() => void> = [];

  function clearDocumentListeners() {
    const unlisteners = documentUnlisteners.splice(0);
    for (let index = unlisteners.length - 1; index >= 0; index -= 1) unlisteners[index]();
  }

  function containsTarget(target: EventTarget | null): boolean {
    if (options.containsTarget) return options.containsTarget(target);
    const node = target as Node | null;
    if (!node) return false;
    if (options.root?.value?.contains(node)) return true;
    if (options.trigger?.value?.contains(node)) return true;
    return false;
  }

  function onDocPointer(event: PointerEvent) {
    if (!valueOf(options.closeOnOutside, true)) return;
    if (containsTarget(event.target)) return;
    options.close();
  }

  function onDocKey(event: KeyboardEvent) {
    if (!valueOf(options.closeOnEscape, true)) return;
    if (event.key !== "Escape" || !options.open.value) return;
    options.close();
    if (valueOf(options.stopEscapePropagation, false)) {
      event.stopPropagation();
    }
  }

  function installDocumentListeners() {
    clearDocumentListeners();
    const unlisteners: Array<() => void> = [];
    if (valueOf(options.closeOnOutside, true)) {
      document.addEventListener("pointerdown", onDocPointer, true);
      unlisteners.push(() => document.removeEventListener("pointerdown", onDocPointer, true));
    }
    if (valueOf(options.closeOnEscape, true)) {
      document.addEventListener("keydown", onDocKey);
      unlisteners.push(() => document.removeEventListener("keydown", onDocKey));
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
