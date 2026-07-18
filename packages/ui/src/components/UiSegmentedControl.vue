<script setup lang="ts">
import type { SegmentedControlProps, SelectionEmits, TabOption } from "@lilia/ui-contract";
import { useSegmentedControlPrimitive } from "@lilia/ui-foundation/selection";

export interface UiSegmentedOption extends TabOption<string | number> {
  value: string | number;
  label: string;
  icon?: unknown;
  disabled?: boolean;
  agentId?: string;
}

const props = withDefaults(defineProps<Omit<SegmentedControlProps<string | number>, "options"> & {
  options: readonly UiSegmentedOption[];
}>(), { orientation: "horizontal", ariaLabel: undefined, ariaDescribedby: undefined });

const emit = defineEmits<SelectionEmits<string | number>>();

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
  <div
    class="segmented ui-segmented"
    role="radiogroup"
    :aria-label="props.ariaLabel"
    :aria-describedby="props.ariaDescribedby"
    :aria-orientation="orientation"
    :data-agent-id="agentId"
  >
    <button
      v-for="(option, index) in props.options"
      :key="String(option.value)"
      type="button"
      class="lilia-interactive-item"
      role="radio"
      :aria-checked="modelValue === option.value"
      :data-lilia-selected="modelValue === option.value ? 'true' : undefined"
      :class="{ 'is-active': modelValue === option.value }"
      :disabled="option.disabled"
      :tabindex="segmented.tabbableValue.value === option.value ? 0 : -1"
      :data-agent-id="option.agentId"
      @click="segmented.select(option)"
      @keydown="onKeydown($event, index)"
    >
      <component v-if="option.icon" :is="option.icon" :size="14" aria-hidden="true" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>
