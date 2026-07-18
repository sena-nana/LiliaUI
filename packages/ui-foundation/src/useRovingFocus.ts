import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { UIOrientation } from "@lilia/ui-contract";

export interface RovingFocusOption<T> {
  value: T;
  disabled?: boolean;
}

export interface RovingFocusOptions<T> {
  options: MaybeRefOrGetter<readonly RovingFocusOption<T>[]>;
  currentValue: MaybeRefOrGetter<T>;
  orientation?: MaybeRefOrGetter<UIOrientation>;
}

export function resolveTabbableValue<T>(
  options: readonly RovingFocusOption<T>[],
  currentValue: T,
): T | undefined {
  return options.some((option) => !option.disabled && Object.is(option.value, currentValue))
    ? currentValue
    : options.find((option) => !option.disabled)?.value;
}

export function resolveRovingFocusIndex<T>(
  options: readonly RovingFocusOption<T>[],
  currentIndex: number,
  key: string,
  orientation: UIOrientation = "horizontal",
): number | null {
  const previous = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  if (![previous, next, "Home", "End"].includes(key)) return null;
  const available = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled);
  if (available.length === 0) return null;
  if (key === "Home") return available[0]?.index ?? null;
  if (key === "End") return available[available.length - 1]?.index ?? null;
  const position = available.findIndex(({ index }) => index === currentIndex);
  const start = position < 0 ? (key === next ? -1 : 0) : position;
  const offset = key === next ? 1 : -1;
  return available[(start + offset + available.length) % available.length]?.index ?? null;
}

export function useRovingFocus<T>(options: RovingFocusOptions<T>) {
  const orientation = () => toValue(options.orientation ?? "horizontal");
  const tabbableValue = computed(() => resolveTabbableValue(
    toValue(options.options),
    toValue(options.currentValue),
  ));

  function move(event: KeyboardEvent, currentIndex: number): number | null {
    const target = resolveRovingFocusIndex(
      toValue(options.options),
      currentIndex,
      event.key,
      orientation(),
    );
    if (target !== null) event.preventDefault();
    return target;
  }

  return { move, tabbableValue };
}
