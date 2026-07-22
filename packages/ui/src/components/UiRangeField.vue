<script setup lang="ts">
import type { SliderEmits, SliderProps } from "@lilia/ui-contract";
import { computed, ref, watch } from "vue";
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
const interacting = ref(false);
const displayValue = ref(props.modelValue);

watch(() => props.modelValue, (value) => {
  if (!interacting.value) displayValue.value = value;
});

const progressPercent = computed(() => {
  const span = Number(props.max) - Number(props.min);
  if (!(span > 0)) return 0;
  return ((Number(displayValue.value) - Number(props.min)) / span) * 100;
});

function endInteraction() {
  interacting.value = false;
  displayValue.value = props.modelValue;
}

function onInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value);
  displayValue.value = next;
  emit("update:modelValue", next);
  emit("input", event);
}
</script>

<template>
  <div
    class="ui-range-field"
    :class="[`ui-range-field--${size}`, { 'is-invalid': invalid }]"
  >
    <input
      type="range"
      :min="min"
      :max="max"
      :step="props.step"
      :value="displayValue"
      :aria-label="props.ariaLabel"
      :aria-describedby="props.ariaDescribedby"
      :aria-invalid="props.invalid || undefined"
      :aria-busy="props.loading || undefined"
      :data-agent-id="agentId"
      :disabled="disabled || loading"
      :style="{ '--ui-range-progress': `${progressPercent}%` }"
      @pointerdown="interacting = true"
      @pointerup="endInteraction"
      @pointercancel="endInteraction"
      @input="onInput"
      @change="endInteraction(); emit('change', $event)"
    />
    <output v-if="showOutput">{{ displayValue }}{{ unit }}</output>
  </div>
</template>

<style>
.ui-range-field {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 30px;
  color: var(--text-muted);
  --ui-range-track-size: 8px;
  --ui-range-thumb-size: 14px;
  --ui-range-track: color-mix(in srgb, var(--bg-hover) 78%, var(--bg));
  --ui-range-fill: var(--accent);
  --ui-range-thumb: var(--accent);
  --ui-range-thumb-active: var(--accent-strong);
}

.ui-range-field--sm {
  min-height: 28px;
  gap: 8px;
  --ui-range-track-size: 6px;
  --ui-range-thumb-size: 12px;
}

.ui-range-field--lg {
  min-height: 36px;
  gap: 12px;
  --ui-range-thumb-size: 16px;
}

.ui-range-field:not(:has(output)) {
  grid-template-columns: minmax(0, 1fr);
}

.ui-range-field.is-invalid {
  --ui-range-fill: var(--err);
  --ui-range-thumb: var(--err);
  --ui-range-thumb-active: var(--err-solid, var(--err));
}

.ui-range-field input {
  width: 100%;
  min-width: 0;
  height: var(--ui-range-thumb-size);
  cursor: pointer;
}

.ui-range-field input::-webkit-slider-runnable-track {
  height: var(--ui-range-track-size);
  border-radius: var(--radius-pill);
  background: linear-gradient(
    to right,
    var(--ui-range-fill) 0%,
    var(--ui-range-fill) var(--ui-range-progress, 0%),
    var(--ui-range-track) var(--ui-range-progress, 0%),
    var(--ui-range-track) 100%
  );
}

.ui-range-field input::-moz-range-track {
  height: var(--ui-range-track-size);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--ui-range-track);
}

.ui-range-field input::-moz-range-progress {
  height: var(--ui-range-track-size);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--ui-range-fill);
}

.ui-range-field input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: var(--ui-range-thumb-size);
  height: var(--ui-range-thumb-size);
  margin-top: calc((var(--ui-range-track-size) - var(--ui-range-thumb-size)) / 2);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--ui-range-thumb);
}

.ui-range-field input::-moz-range-thumb {
  width: var(--ui-range-thumb-size);
  height: var(--ui-range-thumb-size);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--ui-range-thumb);
}

.ui-range-field input:hover:not(:disabled)::-webkit-slider-thumb,
.ui-range-field input:hover:not(:disabled)::-moz-range-thumb,
.ui-range-field input:active:not(:disabled)::-webkit-slider-thumb,
.ui-range-field input:active:not(:disabled)::-moz-range-thumb {
  background: var(--ui-range-thumb-active);
}

.ui-range-field input:focus-visible {
  outline: none;
}

.ui-range-field input:focus-visible::-webkit-slider-thumb,
.ui-range-field input:focus-visible::-moz-range-thumb {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}

.ui-range-field input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-range-field output {
  min-width: 44px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
