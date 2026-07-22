<script setup lang="ts">
import type { XYPadEmits, XYPadProps, XYPadValue } from "@lilia/ui-contract";
import { computed, onBeforeUnmount, ref, watch } from "vue";
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
  yIncreasesUp: true,
  lockAxisWithShift: true,
  agentId: undefined,
  disabled: false,
  loading: false,
  invalid: false,
  size: "md",
  ariaLabel: undefined,
  ariaDescribedby: undefined,
});

const emit = defineEmits<XYPadEmits>();

const padEl = ref<HTMLElement | null>(null);
const interacting = ref(false);
const display = ref<XYPadValue>({ ...props.modelValue });
let lockAxis: "x" | "y" | null = null;
let pointerId: number | null = null;

watch(() => props.modelValue, (value) => {
  if (!interacting.value) display.value = { ...value };
}, { deep: true });

const xSpan = computed(() => Number(props.xMax) - Number(props.xMin));
const ySpan = computed(() => Number(props.yMax) - Number(props.yMin));
const inactive = computed(() => props.disabled || props.loading);

const thumbStyle = computed(() => ({
  left: `${percentX(display.value.x)}%`,
  top: `${percentY(display.value.y)}%`,
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function quantizeAxis(value: number, min: number, max: number) {
  const step = Number(props.step);
  if (!(step > 0)) return clamp(value, min, max);
  const stepped = Math.round((value - min) / step) * step + min;
  return clamp(Number(stepped.toFixed(6)), min, max);
}

function percentX(value: number) {
  if (!(xSpan.value > 0)) return 50;
  return ((value - Number(props.xMin)) / xSpan.value) * 100;
}

function percentY(value: number) {
  if (!(ySpan.value > 0)) return 50;
  if (props.yIncreasesUp) {
    return ((Number(props.yMax) - value) / ySpan.value) * 100;
  }
  return ((value - Number(props.yMin)) / ySpan.value) * 100;
}

function valuesFromPointer(event: PointerEvent): XYPadValue {
  const pad = padEl.value;
  if (!pad) return { ...display.value };
  const rect = pad.getBoundingClientRect();
  const nx = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
  const ny = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
  let x = Number(props.xMin) + clamp(nx, 0, 1) * xSpan.value;
  let y = props.yIncreasesUp
    ? Number(props.yMax) - clamp(ny, 0, 1) * ySpan.value
    : Number(props.yMin) + clamp(ny, 0, 1) * ySpan.value;
  x = quantizeAxis(x, Number(props.xMin), Number(props.xMax));
  y = quantizeAxis(y, Number(props.yMin), Number(props.yMax));
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
  pointerId = event.pointerId;
  pad.setPointerCapture?.(event.pointerId);
  lockAxis = null;
  setValue(valuesFromPointer(event), event, false);
}

function onPointerMove(event: PointerEvent) {
  if (!interacting.value || pointerId !== event.pointerId || inactive.value) return;
  if (props.lockAxisWithShift && event.shiftKey && lockAxis === null) {
    const next = valuesFromPointer(event);
    const dx = Math.abs(next.x - display.value.x) / Math.max(xSpan.value, 1e-6);
    const dy = Math.abs(next.y - display.value.y) / Math.max(ySpan.value, 1e-6);
    lockAxis = dx >= dy ? "x" : "y";
  }
  if (!event.shiftKey) lockAxis = null;
  setValue(valuesFromPointer(event), event, false);
}

function onPointerUp(event: PointerEvent) {
  if (!interacting.value || pointerId !== event.pointerId) return;
  const pad = padEl.value;
  if (pad?.hasPointerCapture?.(event.pointerId)) {
    pad.releasePointerCapture?.(event.pointerId);
  }
  pointerId = null;
  lockAxis = null;
  setValue(valuesFromPointer(event), event, true);
}

function onKeydown(event: KeyboardEvent) {
  if (inactive.value) return;
  const step = Number(props.step) > 0
    ? Number(props.step)
    : Math.max(xSpan.value, ySpan.value) / 100 || 0.01;
  const largeX = Math.max(step, xSpan.value / 10);
  const largeY = Math.max(step, ySpan.value / 10);
  let { x, y } = display.value;
  switch (event.key) {
    case "ArrowLeft":
      x -= event.shiftKey ? largeX : step;
      break;
    case "ArrowRight":
      x += event.shiftKey ? largeX : step;
      break;
    case "ArrowUp":
      y += props.yIncreasesUp
        ? (event.shiftKey ? largeY : step)
        : -(event.shiftKey ? largeY : step);
      break;
    case "ArrowDown":
      y -= props.yIncreasesUp
        ? (event.shiftKey ? largeY : step)
        : -(event.shiftKey ? largeY : step);
      break;
    case "Home":
      x = Number(props.xMin);
      break;
    case "End":
      x = Number(props.xMax);
      break;
    case "PageUp":
      y = Number(props.yMax);
      break;
    case "PageDown":
      y = Number(props.yMin);
      break;
    default:
      return;
  }
  event.preventDefault();
  interacting.value = true;
  setValue({
    x: quantizeAxis(x, Number(props.xMin), Number(props.xMax)),
    y: quantizeAxis(y, Number(props.yMin), Number(props.yMax)),
  }, event, true);
}

onBeforeUnmount(() => {
  interacting.value = false;
  pointerId = null;
  lockAxis = null;
});
</script>

<template>
  <div
    ref="padEl"
    class="ui-xy-pad"
    :class="[
      `ui-xy-pad--${size}`,
      {
        'is-invalid': invalid,
        'is-disabled': inactive,
        'is-interacting': interacting,
      },
    ]"
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
  --ui-xy-pad-surface: var(--bg-subtle);
  --ui-xy-pad-border: var(--border);
  --ui-xy-pad-crosshair: color-mix(in srgb, var(--border-strong) 55%, transparent);
  --ui-xy-pad-thumb: var(--accent);
  --ui-xy-pad-thumb-fill: color-mix(in srgb, var(--accent) 70%, var(--bg));
  position: relative;
  width: 100%;
  min-width: 0;
  height: var(--ui-xy-pad-size);
  border: 1px solid var(--ui-xy-pad-border);
  border-radius: var(--radius-xs);
  background: var(--ui-xy-pad-surface);
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
  --ui-xy-pad-border: var(--err);
  --ui-xy-pad-thumb: var(--err);
  --ui-xy-pad-thumb-fill: color-mix(in srgb, var(--err) 70%, var(--bg));
}

.ui-xy-pad__crosshair {
  position: absolute;
  background: var(--ui-xy-pad-crosshair);
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
  border: 1px solid var(--ui-xy-pad-thumb);
  border-radius: 50%;
  background: var(--ui-xy-pad-thumb-fill);
  box-sizing: border-box;
  pointer-events: none;
}

.ui-xy-pad.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
