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
const trackEl = ref<HTMLElement | null>(null);
const interacting = ref(false);
const displayValue = ref(props.modelValue);

watch(() => props.modelValue, (value) => {
  if (!interacting.value) displayValue.value = value;
});

const span = computed(() => Number(props.max) - Number(props.min));
const progressPercent = computed(() => {
  if (!(span.value > 0)) return 0;
  return ((Number(displayValue.value) - Number(props.min)) / span.value) * 100;
});
const inactive = computed(() => props.disabled || props.loading);

function clamp(value: number) {
  return Math.min(Number(props.max), Math.max(Number(props.min), value));
}

function quantize(value: number) {
  const step = Number(props.step) > 0 ? Number(props.step) : 1;
  const stepped = Math.round((value - Number(props.min)) / step) * step + Number(props.min);
  return clamp(Number(stepped.toFixed(6)));
}

function setValue(next: number, event: Event, commit: boolean) {
  const value = quantize(next);
  displayValue.value = value;
  emit("update:modelValue", value);
  emit("input", event);
  if (commit) {
    interacting.value = false;
    emit("change", event);
  }
}

function valueFromClientX(clientX: number) {
  const track = trackEl.value;
  if (!track || !(span.value > 0)) return Number(props.min);
  const rect = track.getBoundingClientRect();
  if (!(rect.width > 0)) return Number(displayValue.value);
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return Number(props.min) + ratio * span.value;
}

function onPointerDown(event: PointerEvent) {
  if (inactive.value || event.button !== 0) return;
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  interacting.value = true;
  setValue(valueFromClientX(event.clientX), event, false);
}

function onPointerMove(event: PointerEvent) {
  if (!interacting.value || inactive.value) return;
  setValue(valueFromClientX(event.clientX), event, false);
}

function onPointerUp(event: PointerEvent) {
  if (!interacting.value) return;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  setValue(valueFromClientX(event.clientX), event, true);
}

function onKeydown(event: KeyboardEvent) {
  if (inactive.value) return;
  const step = Number(props.step) > 0 ? Number(props.step) : 1;
  const large = Math.max(step, span.value / 10);
  let next: number | null = null;
  switch (event.key) {
    case "ArrowLeft":
    case "ArrowDown":
      next = Number(displayValue.value) - step;
      break;
    case "ArrowRight":
    case "ArrowUp":
      next = Number(displayValue.value) + step;
      break;
    case "PageDown":
      next = Number(displayValue.value) - large;
      break;
    case "PageUp":
      next = Number(displayValue.value) + large;
      break;
    case "Home":
      next = Number(props.min);
      break;
    case "End":
      next = Number(props.max);
      break;
    default:
      return;
  }
  event.preventDefault();
  interacting.value = true;
  setValue(next, event, true);
}
</script>

<template>
  <div
    class="ui-range-field"
    :class="[`ui-range-field--${size}`, { 'is-invalid': invalid, 'is-disabled': inactive }]"
    :style="{ '--ui-range-progress': `${progressPercent}%` }"
  >
    <div
      ref="trackEl"
      class="ui-range-field__track"
      role="slider"
      :tabindex="inactive ? -1 : 0"
      :aria-label="props.ariaLabel"
      :aria-describedby="props.ariaDescribedby"
      :aria-invalid="props.invalid || undefined"
      :aria-busy="props.loading || undefined"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="displayValue"
      :aria-disabled="inactive || undefined"
      :data-agent-id="agentId"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <div class="ui-range-field__rail" aria-hidden="true">
        <div class="ui-range-field__fill" />
      </div>
      <div class="ui-range-field__thumb" aria-hidden="true" />
    </div>
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

.ui-range-field__track {
  position: relative;
  width: 100%;
  min-width: 0;
  height: var(--ui-range-thumb-size);
  display: grid;
  align-items: center;
  overflow: visible;
  touch-action: none;
  cursor: pointer;
}

.ui-range-field__track:focus-visible {
  outline: none;
}

.ui-range-field__track:focus-visible .ui-range-field__thumb {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}

.ui-range-field__rail {
  position: absolute;
  inset-inline: 0;
  top: 50%;
  height: var(--ui-range-track-size);
  transform: translateY(-50%);
  border-radius: var(--radius-pill);
  background: var(--ui-range-track);
  pointer-events: none;
}

.ui-range-field__fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--ui-range-progress, 0%);
  border-radius: inherit;
  background: var(--ui-range-fill);
}

.ui-range-field__thumb {
  position: absolute;
  top: 50%;
  left: var(--ui-range-progress, 0%);
  width: var(--ui-range-thumb-size);
  height: var(--ui-range-thumb-size);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--ui-range-thumb);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.ui-range-field__track:hover:not([aria-disabled="true"]) .ui-range-field__thumb,
.ui-range-field__track:active:not([aria-disabled="true"]) .ui-range-field__thumb {
  background: var(--ui-range-thumb-active);
}

.ui-range-field.is-disabled .ui-range-field__track {
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
