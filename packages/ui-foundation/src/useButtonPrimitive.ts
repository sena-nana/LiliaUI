import { computed, type ComputedRef } from "vue";
import type { ButtonProps } from "@lilia/ui-contract";

export interface ButtonPrimitive {
  disabled: ComputedRef<boolean>;
  ariaBusy: ComputedRef<"true" | undefined>;
  onPress: (event: MouseEvent | KeyboardEvent) => boolean;
}

export function useButtonPrimitive(
  props: Pick<ButtonProps, "disabled" | "loading">,
  press?: (event: MouseEvent | KeyboardEvent) => void,
): ButtonPrimitive {
  const disabled = computed(() => props.disabled === true || props.loading === true);
  return {
    disabled,
    ariaBusy: computed(() => props.loading ? "true" : undefined),
    onPress(event) {
      if (disabled.value) {
        event.preventDefault();
        return false;
      }
      press?.(event);
      return true;
    },
  };
}
