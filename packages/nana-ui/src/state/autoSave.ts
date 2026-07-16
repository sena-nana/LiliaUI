import { onBeforeUnmount, ref, type Ref } from "vue";
import type { SaveState } from "@lilia/ui-contract";

export interface AutoSaveOptions<T> {
  serialize: () => T;
  save: (snapshot: T) => Promise<void>;
  delayMs?: number;
}

export interface AutoSaveController {
  state: Ref<SaveState>;
  markDirty: () => void;
  flush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  cancel: () => void;
}

export function useAutoSave<T>(options: AutoSaveOptions<T>): AutoSaveController {
  const state = ref<SaveState>("clean");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let epoch = 0;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    epoch += 1;
  };
  async function flush() {
    cancel();
    const currentEpoch = epoch;
    state.value = "saving";
    try {
      await options.save(options.serialize());
      if (currentEpoch !== epoch) return false;
      state.value = "saved";
      return true;
    } catch {
      if (currentEpoch === epoch) state.value = "failed";
      return false;
    }
  }
  function markDirty() {
    cancel();
    state.value = "dirty";
    timer = setTimeout(() => void flush(), options.delayMs ?? 600);
  }
  onBeforeUnmount(cancel);
  return { state, markDirty, flush, retry: flush, cancel };
}
