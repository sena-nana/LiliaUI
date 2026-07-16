<script setup lang="ts">
import type { UiControlSize } from "./UiInput.vue";

export interface UiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue: string | number;
  options: UiSelectOption[];
  size?: UiControlSize;
  disabled?: boolean;
  ariaLabel?: string;
  "aria-label"?: string;
  agentId?: string;
}>(), {
  size: "md",
  disabled: false,
  ariaLabel: undefined,
  "aria-label": undefined,
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [event: Event];
}>();

function onChange(event: Event) {
  const rawValue = (event.target as HTMLSelectElement).value;
  const selected = props.options.find((option) => String(option.value) === rawValue);
  emit("update:modelValue", selected?.value ?? rawValue);
  emit("change", event);
}
</script>

<template>
  <select
    class="ui-select"
    :class="`ui-select--${size}`"
    :value="modelValue"
    :disabled="disabled"
    :aria-label="props.ariaLabel ?? props['aria-label']"
    :data-agent-id="agentId"
    @change="onChange"
  >
    <option
      v-for="option in options"
      :key="`${typeof option.value}:${option.value}`"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.ui-select {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  transition: border-color 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
}

.ui-select--md {
  height: 30px;
  padding: 0 28px 0 9px;
}

.ui-select--sm {
  height: 28px;
  padding: 0 26px 0 8px;
}

.ui-select:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-select:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
  outline: none;
}

.ui-select:disabled {
  background-color: var(--bg-subtle);
  color: var(--text-faint);
  cursor: not-allowed;
  opacity: 0.68;
}
</style>
