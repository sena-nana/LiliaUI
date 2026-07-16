import { computed, readonly, ref, shallowRef, type Ref } from "vue";

export type AsyncTaskStatus = "idle" | "running" | "completed" | "cancelled" | "failed";

export interface AsyncTaskController<TResult> {
  status: Readonly<Ref<AsyncTaskStatus>>;
  progress: Readonly<Ref<number | undefined>>;
  result: Readonly<Ref<TResult | undefined>>;
  error: Readonly<Ref<unknown>>;
  run: (task: (signal: AbortSignal, updateProgress: (value?: number) => void) => Promise<TResult>) => Promise<TResult | undefined>;
  cancel: () => void;
}

export function createAsyncTaskController<TResult>(): AsyncTaskController<TResult> {
  const status = ref<AsyncTaskStatus>("idle");
  const progress = ref<number>();
  // Task results are opaque application values. Deeply unwrapping them changes
  // generic types (and can also proxy class instances), so keep the boundary shallow.
  const result = shallowRef<TResult>();
  const error = ref<unknown>();
  let controller: AbortController | undefined;
  return {
    status: readonly(status), progress: readonly(progress), result: computed(() => result.value), error: readonly(error),
    async run(task) {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      status.value = "running"; progress.value = undefined; result.value = undefined; error.value = undefined;
      try {
        const value = await task(current.signal, (next) => {
          if (controller === current) progress.value = next;
        });
        if (controller !== current || current.signal.aborted) return undefined;
        result.value = value; status.value = "completed"; return value;
      } catch (cause) {
        if (controller !== current || current.signal.aborted) return undefined;
        error.value = cause; status.value = "failed"; return undefined;
      }
    },
    cancel() {
      if (!controller || controller.signal.aborted) return;
      controller.abort();
      status.value = "cancelled";
    },
  };
}
