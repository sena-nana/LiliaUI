<script setup lang="ts">
import type { UiControlSize } from "./UiInput.vue";

const props = withDefaults(defineProps<{
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ariaLabel?: string;
  "aria-label"?: string;
  agentId?: string;
  disabled?: boolean;
  size?: UiControlSize;
  showOutput?: boolean;
}>(), {
  step: 1,
  unit: "",
  agentId: undefined,
  disabled: false,
  size: "md",
  showOutput: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
  input: [event: Event];
  change: [event: Event];
}>();

function onInput(event: Event) {
  emit("update:modelValue", Number((event.target as HTMLInputElement).value));
  emit("input", event);
}

function onChange(event: Event) {
  emit("change", event);
}
</script>

<template>
  <div class="ui-range-field" :class="`ui-range-field--${size}`">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="props.step"
      :value="modelValue"
      :aria-label="props.ariaLabel ?? props['aria-label']"
      :data-agent-id="agentId"
      :disabled="disabled"
      @input="onInput"
      @change="onChange"
    />
    <output v-if="showOutput">{{ modelValue }}{{ unit }}</output>
  </div>
</template>

<style scoped>
.ui-range-field {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) auto;
  align-items: center;
  min-width: 0;
  color: var(--text-muted);
}

.ui-range-field--md {
  min-height: 30px;
  gap: 10px;
}

.ui-range-field--sm {
  min-height: 28px;
  gap: 8px;
}

.ui-range-field:not(:has(output)) {
  grid-template-columns: minmax(0, 1fr);
}

.ui-range-field input {
  width: 100%;
  min-width: 0;
  margin: 0;
  accent-color: var(--accent);
  cursor: pointer;
}

.ui-range-field input:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}

.ui-range-field input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-range-field output {
  min-width: 44px;
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
