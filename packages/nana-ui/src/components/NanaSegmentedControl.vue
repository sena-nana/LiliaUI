<script setup lang="ts" generic="T extends string | number">
import type { SegmentedControlProps, SelectionEmits } from "@lilia/ui-contract";
import { useSegmentedControlPrimitive } from "@lilia/ui-foundation/selection";
const props = withDefaults(defineProps<SegmentedControlProps<T>>(), { orientation: "horizontal" });
const emit = defineEmits<SelectionEmits<T>>();
const segmented = useSegmentedControlPrimitive({
  options: () => props.options,
  modelValue: () => props.modelValue,
  orientation: () => props.orientation,
  onSelect(value) { emit("update:modelValue", value); emit("change", value); },
});
function onKeydown(event: KeyboardEvent, index: number) {
  const list = (event.currentTarget as HTMLElement).parentElement;
  segmented.onKeydown(event, index, () => list?.querySelectorAll<HTMLElement>("[role='radio']") ?? []);
}
</script>
<template>
  <div class="nana-tabs nana-segmented" role="radiogroup" :aria-label="ariaLabel" :aria-describedby="ariaDescribedby" :aria-orientation="orientation" :data-agent-id="agentId">
    <button v-for="(option, index) in options" :key="String(option.value)" type="button" class="lilia-interactive-item" role="radio" data-lilia-selected-indicator="bottom" :aria-checked="option.value === modelValue" :data-lilia-selected="option.value === modelValue ? 'true' : undefined" :tabindex="segmented.tabbableValue.value === option.value ? 0 : -1" :disabled="option.disabled" @click="segmented.select(option)" @keydown="onKeydown($event, index)">{{ option.label }}</button>
  </div>
</template>
