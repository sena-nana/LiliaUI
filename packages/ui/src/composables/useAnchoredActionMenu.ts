import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  createAnchoredMenuPosition,
  type AnchoredMenuPosition,
} from "./menuMotion";
import { addDomEventListener, runUnlistenFns } from "../utils/eventListeners";

const MENU_SELECTOR = ".sb-menu";

export function useAnchoredActionMenu() {
  const open = ref(false);
  const position = ref<AnchoredMenuPosition>(createAnchoredMenuPosition(0, 0));
  let listenerSeq = 0;
  let documentUnlisteners: Array<() => void> = [];

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

  function onDocPointer(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.(MENU_SELECTOR)) return;
    close();
  }

  function onDocKey(event: KeyboardEvent) {
    if (event.key === "Escape" && open.value) {
      close();
      event.stopPropagation();
    }
  }

  function clearDocumentListeners() {
    runUnlistenFns(documentUnlisteners.splice(0).reverse());
  }

  function installDocumentListeners() {
    clearDocumentListeners();
    documentUnlisteners = [
      addDomEventListener(document, "pointerdown", onDocPointer, true),
      addDomEventListener(document, "keydown", onDocKey),
    ];
  }

  watch(open, async (value) => {
    const seq = ++listenerSeq;
    clearDocumentListeners();
    if (!value) return;
    await nextTick();
    if (seq !== listenerSeq || !open.value) return;
    installDocumentListeners();
  });

  onBeforeUnmount(() => {
    listenerSeq += 1;
    clearDocumentListeners();
  });

  return {
    close,
    open,
    openAtEvent,
    position,
  };
}
