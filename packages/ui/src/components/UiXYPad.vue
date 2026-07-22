<script setup lang="ts">
import type { XYPadEmits, XYPadProps, XYPadValue } from "@lilia/ui-contract";
import { computed, ref, watch } from "vue";
import type { UiControlSize } from "./UiInput.vue";

const props = withDefaults(defineProps<XYPadProps & {
  size?: UiControlSize;
}>(), {
  modelValue: () => ({ x: 0, y: 0 }),
  xMin: 0,
  xMax: 1,
  yMin: 0,
  yMax: 1,
  step: 0,
  agentId: undefined,
  disabled: false,
  loading: false,
  invalid: false,
  size: "md",
});

const emit = defineEmits<XYPadEmits>();

const padEl = ref<HTMLElement | null>(null);
const interacting = ref(false);
const display = ref<XYPadValue>({ ...props.modelValue });
let lockAxis: "x" | "y" | null = null;

watch(() => props.modelValue, (value) => {
  if (!interacting.value) display.value = { ...value };
}, { deep: true });

const xSpan = computed(() => props.xMax - props.xMin);
const ySpan = computed(() => props.yMax - props.yMin);
const inactive = computed(() => props.disabled || props.loading);
const thumbStyle = computed(() => ({
  left: `${axisPercent(display.value.x, props.xMin, xSpan.value)}%`,
  top: `${!(ySpan.value > 0) ? 50 : ((props.yMax - display.value.y) / ySpan.value) * 100}%`,
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function axisPercent(value: number, min: number, span: number) {
  if (!(span > 0)) return 50;
  return ((value - min) / span) * 100;
}

function quantize(value: number, min: number, max: number) {
  if (!(props.step > 0)) return clamp(value, min, max);
  const stepped = Math.round((value - min) / props.step) * props.step + min;
  return clamp(Number(stepped.toFixed(6)), min, max);
}

function valuesFromPointer(event: PointerEvent): XYPadValue {
  const pad = padEl.value;
  if (!pad) return { ...display.value };
  const rect = pad.getBoundingClientRect();
  const nx = rect.width > 0 ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0.5;
  const ny = rect.height > 0 ? clamp((event.clientY - rect.top) / rect.height, 0, 1) : 0.5;
  let x = quantize(props.xMin + nx * xSpan.value, props.xMin, props.xMax);
  let y = quantize(props.yMax - ny * ySpan.value, props.yMin, props.yMax);
  if (lockAxis === "x") y = display.value.y;
  if (lockAxis === "y") x = display.value.x;
  return { x, y };
}

function setValue(next: XYPadValue, event: Event, commit: boolean) {
  display.value = next;
  emit("update:modelValue", { ...next });
  emit("input", event);
  if (commit) {
    interacting.value = false;
    emit("change", event);
  }
}

function onPointerDown(event: PointerEvent) {
  if (inactive.value || event.button !== 0) return;
  const pad = padEl.value;
  if (!pad) return;
  event.preventDefault();
  interacting.value = true;
  lockAxis = null;
  pad.setPointerCapture?.(event.pointerId);
  setValue(valuesFromPointer(event), event, false);
}

function onPointerMove(event: PointerEvent) {
  if (!interacting.value || inactive.value) return;
  if (event.shiftKey && lockAxis === null) {
    const next = valuesFromPointer(event);
    const dx = Math.abs(next.x - display.value.x) / Math.max(xSpan.value, 1e-6);
    const dy = Math.abs(next.y - display.value.y) / Math.max(ySpan.value, 1e-6);
    lockAxis = dx >= dy ? "x" : "y";
  }
  if (!event.shiftKey) lockAxis = null;
  setValue(valuesFromPointer(event), event, false);
}

function onPointerUp(event: PointerEvent) {
  if (!interacting.value) return;
  const pad = padEl.value;
  if (pad?.hasPointerCapture?.(event.pointerId)) pad.releasePointerCapture?.(event.pointerId);
  lockAxis = null;
  setValue(valuesFromPointer(event), event, true);
}

function onKeydown(event: KeyboardEvent) {
  if (inactive.value) return;
  const step = props.step > 0 ? props.step : Math.max(xSpan.value, ySpan.value, 1) / 100;
  let { x, y } = display.value;
  switch (event.key) {
    case "ArrowLeft": x -= step; break;
    case "ArrowRight": x += step; break;
    case "ArrowUp": y += step; break;
    case "ArrowDown": y -= step; break;
    default: return;
  }
  event.preventDefault();
  setValue({
    x: quantize(x, props.xMin, props.xMax),
    y: quantize(y, props.yMin, props.yMax),
  }, event, true);
}
</script>

<template>
  <div
    ref="padEl"
    class="ui-xy-pad"
    :class="[`ui-xy-pad--${size}`, { 'is-invalid': invalid, 'is-disabled': inactive }]"
    role="group"
    :tabindex="inactive ? -1 : 0"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-invalid="invalid || undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="inactive || undefined"
    :data-agent-id="agentId"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
  >
    <span class="ui-xy-pad__crosshair ui-xy-pad__crosshair--x" aria-hidden="true" />
    <span class="ui-xy-pad__crosshair ui-xy-pad__crosshair--y" aria-hidden="true" />
    <span class="ui-xy-pad__thumb" aria-hidden="true" :style="thumbStyle" />
  </div>
</template>

<style>
.ui-xy-pad {
  --ui-xy-pad-size: 48px;
  --ui-xy-pad-thumb-size: 10px;
  position: relative;
  width: 100%;
  min-width: 0;
  height: var(--ui-xy-pad-size);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  touch-action: none;
  cursor: crosshair;
  user-select: none;
  outline: none;
}

.ui-xy-pad--sm {
  --ui-xy-pad-size: 40px;
  --ui-xy-pad-thumb-size: 8px;
}

.ui-xy-pad--lg {
  --ui-xy-pad-size: 64px;
  --ui-xy-pad-thumb-size: 12px;
}

.ui-xy-pad:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: 1px;
}

.ui-xy-pad.is-invalid {
  border-color: var(--err);
}

.ui-xy-pad__crosshair {
  position: absolute;
  background: color-mix(in srgb, var(--border-strong) 55%, transparent);
  pointer-events: none;
}

.ui-xy-pad__crosshair--x {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.ui-xy-pad__crosshair--y {
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}

.ui-xy-pad__thumb {
  position: absolute;
  width: var(--ui-xy-pad-thumb-size);
  height: var(--ui-xy-pad-thumb-size);
  margin-left: calc(var(--ui-xy-pad-thumb-size) / -2);
  margin-top: calc(var(--ui-xy-pad-thumb-size) / -2);
  border: 1px solid var(--accent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 70%, var(--bg));
  box-sizing: border-box;
  pointer-events: none;
}

.ui-xy-pad.is-invalid .ui-xy-pad__thumb {
  border-color: var(--err);
  background: color-mix(in srgb, var(--err) 70%, var(--bg));
}

.ui-xy-pad.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
