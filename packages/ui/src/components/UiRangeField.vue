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
  const min = Number(props.min);
  const max = Number(props.max);
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return 0;
  const value = Number(displayValue.value);
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  return ((clamped - min) / span) * 100;
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
    :class="[
      `ui-range-field--${size}`,
      { 'is-invalid': invalid },
    ]"
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
  min-width: 0;
  color: var(--text-muted);
  --ui-range-track-size: 4px;
  --ui-range-thumb-size: 12px;
}

.ui-range-field--md {
  min-height: 30px;
  gap: 10px;
}

.ui-range-field--sm {
  min-height: 28px;
  gap: 8px;
  --ui-range-track-size: 3px;
  --ui-range-thumb-size: 10px;
}

.ui-range-field--lg {
  min-height: 36px;
  gap: 12px;
  --ui-range-track-size: 4px;
  --ui-range-thumb-size: 14px;
}

.ui-range-field:not(:has(output)) {
  grid-template-columns: minmax(0, 1fr);
}

.ui-range-field input {
  --ui-range-track: color-mix(in srgb, var(--bg-hover) 78%, var(--bg));
  --ui-range-fill: var(--accent);
  width: 100%;
  min-width: 0;
  height: var(--ui-range-thumb-size);
  margin: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
}

.ui-range-field input::-webkit-slider-runnable-track {
  height: var(--ui-range-track-size);
  border: 1px solid color-mix(in srgb, var(--border-strong) 82%, transparent);
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
  border: 1px solid color-mix(in srgb, var(--border-strong) 82%, transparent);
  border-radius: var(--radius-pill);
  background: var(--ui-range-track);
}

.ui-range-field input::-moz-range-progress {
  height: var(--ui-range-track-size);
  border-radius: var(--radius-pill);
  background: var(--ui-range-fill);
}

.ui-range-field input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--ui-range-thumb-size);
  height: var(--ui-range-thumb-size);
  margin-top: calc((var(--ui-range-track-size) - var(--ui-range-thumb-size)) / 2 - 1px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--bg-elev);
  box-shadow: none;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.ui-range-field input::-moz-range-thumb {
  width: var(--ui-range-thumb-size);
  height: var(--ui-range-thumb-size);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--bg-elev);
  box-shadow: none;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.ui-range-field input:hover:not(:disabled)::-webkit-slider-thumb,
.ui-range-field input:active:not(:disabled)::-webkit-slider-thumb {
  border-color: color-mix(in srgb, var(--accent) 72%, var(--border-strong));
}

.ui-range-field input:hover:not(:disabled)::-moz-range-thumb,
.ui-range-field input:active:not(:disabled)::-moz-range-thumb {
  border-color: color-mix(in srgb, var(--accent) 72%, var(--border-strong));
}

.ui-range-field input:focus-visible {
  outline: none;
}

.ui-range-field input:focus-visible::-webkit-slider-thumb {
  outline: 2px solid color-mix(in srgb, var(--accent) 58%, transparent);
  outline-offset: 2px;
}

.ui-range-field input:focus-visible::-moz-range-thumb {
  outline: 2px solid color-mix(in srgb, var(--accent) 58%, transparent);
  outline-offset: 2px;
}

.ui-range-field.is-invalid input {
  --ui-range-fill: var(--err);
}

.ui-range-field.is-invalid input::-webkit-slider-thumb,
.ui-range-field.is-invalid input::-moz-range-thumb {
  border-color: var(--err);
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

@media (prefers-reduced-motion: reduce) {
  .ui-range-field input::-webkit-slider-thumb,
  .ui-range-field input::-moz-range-thumb {
    transition: none;
  }
}
</style>
