<script setup lang="ts">
import type { SliderEmits, SliderProps } from "@lilia/ui-contract";
import type { UiControlSize } from "./UiInput.vue";

const props = withDefaults(defineProps<SliderProps & {
  unit?: string;
  size?: UiControlSize;
  showOutput?: boolean;
}>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  unit: "",
  agentId: undefined,
  disabled: false,
  loading: false,
  invalid: false,
  size: "md",
  showOutput: true,
});

const emit = defineEmits<SliderEmits>();

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
      :aria-label="props.ariaLabel"
      :aria-describedby="props.ariaDescribedby"
      :aria-invalid="props.invalid || undefined"
      :aria-busy="props.loading || undefined"
      :data-agent-id="agentId"
      :disabled="disabled || loading"
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

.ui-range-field--lg {
  min-height: 36px;
  gap: 12px;
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
