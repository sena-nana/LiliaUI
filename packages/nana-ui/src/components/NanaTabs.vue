<script setup lang="ts" generic="T extends string | number">
import type { SelectionEmits, TabsProps } from "@lilia/ui-contract";
import { useTabsPrimitive } from "@lilia/ui-foundation/selection";
const props = withDefaults(defineProps<TabsProps<T>>(), { orientation: "horizontal" });
const emit = defineEmits<SelectionEmits<T>>();
const tabs = useTabsPrimitive({
  options: () => props.options,
  modelValue: () => props.modelValue,
  orientation: () => props.orientation,
  onSelect(value) { emit("update:modelValue", value); emit("change", value); },
});
function onKeydown(event: KeyboardEvent, index: number) {
  const list = (event.currentTarget as HTMLElement).parentElement;
  tabs.onKeydown(event, index, () => list?.querySelectorAll<HTMLElement>("[role='tab']") ?? []);
}
</script>

<template>
  <div class="nana-tabs" :class="`nana-tabs--${orientation}`" role="tablist" :aria-label="ariaLabel" :aria-describedby="ariaDescribedby" :aria-orientation="orientation" :data-agent-id="agentId">
    <button v-for="(option, index) in options" :key="String(option.value)" type="button" class="lilia-interactive-item" role="tab" data-lilia-selected-indicator="bottom" :aria-selected="option.value === modelValue" :data-lilia-selected="option.value === modelValue ? 'true' : undefined" :tabindex="tabs.tabbableValue.value === option.value ? 0 : -1" :disabled="option.disabled" @click="tabs.select(option)" @keydown="onKeydown($event, index)">{{ option.label }}</button>
  </div>
</template>
