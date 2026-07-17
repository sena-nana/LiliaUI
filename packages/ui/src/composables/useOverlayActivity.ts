import {
  computed,
  onBeforeUnmount,
  reactive,
  type Ref,
} from "vue";

const activeOverlayTokens = reactive(new Set<symbol>());
const overlayActivity = computed(() => activeOverlayTokens.size > 0);

export function useOverlayActivity(): Readonly<Ref<boolean>> {
  return overlayActivity;
}

export function useOverlayPresence() {
  const token = Symbol("lilia-overlay");
  let active = false;

  function activate() {
    if (active) return;
    active = true;
    activeOverlayTokens.add(token);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    activeOverlayTokens.delete(token);
  }

  onBeforeUnmount(deactivate);

  return {
    activate,
    deactivate,
  };
}
