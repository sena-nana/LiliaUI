import { onBeforeUnmount, ref, type Ref } from "vue";

export interface TooltipPrimitive {
  visible: Ref<boolean>;
  show: () => void;
  hide: () => void;
}

export function useTooltipPrimitive(delayMs = 350): TooltipPrimitive {
  const visible = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  onBeforeUnmount(clear);
  return {
    visible,
    show() {
      clear();
      timer = setTimeout(() => {
        visible.value = true;
        timer = undefined;
      }, Math.max(0, delayMs));
    },
    hide() {
      clear();
      visible.value = false;
    },
  };
}
