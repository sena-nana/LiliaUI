import { toValue, type MaybeRefOrGetter } from "vue";
import type { TabOption } from "@lilia/ui-contract";
import { useRovingFocus } from "./useRovingFocus";

export interface SelectionPrimitiveOptions<T> {
  options: MaybeRefOrGetter<readonly TabOption<T>[]>;
  modelValue: MaybeRefOrGetter<T>;
  orientation?: MaybeRefOrGetter<"horizontal" | "vertical">;
  onSelect: (value: T) => void;
}

export function useSelectionPrimitive<T>(options: SelectionPrimitiveOptions<T>) {
  const roving = useRovingFocus({
    options: options.options,
    currentValue: options.modelValue,
    orientation: options.orientation,
  });

  function select(option: TabOption<T> | undefined): boolean {
    if (!option || option.disabled) return false;
    options.onSelect(option.value);
    return true;
  }

  function onKeydown(
    event: KeyboardEvent,
    currentIndex: number,
    elements: () => ArrayLike<HTMLElement>,
  ): void {
    const targetIndex = roving.move(event, currentIndex);
    if (targetIndex === null) return;
    const target = toValue(options.options)[targetIndex];
    if (!select(target)) return;
    elements()[targetIndex]?.focus();
  }

  return { ...roving, onKeydown, select };
}

export const useTabsPrimitive = useSelectionPrimitive;
export const useSegmentedControlPrimitive = useSelectionPrimitive;
