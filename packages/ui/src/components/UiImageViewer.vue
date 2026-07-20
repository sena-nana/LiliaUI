<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { addDomEventListener } from "../utils/eventListeners";
import { useOverlayPresence } from "../composables/useOverlayActivity";

export interface UiImageViewerSource {
  src: string;
  alt?: string;
  name?: string;
  metadata?: string;
}

const props = withDefaults(defineProps<{
  source: UiImageViewerSource;
  agentId?: string;
}>(), {
  agentId: undefined,
});

const emit = defineEmits<{ close: [] }>();
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const WHEEL_SCALE_STEP = 0.0016;
const MIN_VISIBLE_COVERAGE_RATIO = 0.75;

const overlayRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const stageSize = ref({ width: 0, height: 0 });
const naturalWidth = ref<number | null>(null);
const naturalHeight = ref<number | null>(null);
const zoom = ref(MIN_ZOOM);
const offset = ref({ x: 0, y: 0 });
const drag = ref<{
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null>(null);
let resizeObserver: ResizeObserver | null = null;
let unlistenWindowResize: (() => void) | null = null;
let disposed = false;

const dialogProps = {
  open: true,
  closeOnEscape: true,
  closeOnOutside: true,
  initialFocus: "dialog" as const,
};
const dialog = useDialogPrimitive(dialogProps, overlayRef, close);
const overlayPresence = useOverlayPresence();

const fitScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value || !stageSize.value.width || !stageSize.value.height) {
    return 1;
  }
  return Math.min(
    1,
    stageSize.value.width / naturalWidth.value,
    stageSize.value.height / naturalHeight.value,
  );
});
const fittedWidth = computed(() => naturalWidth.value ? naturalWidth.value * fitScale.value : null);
const fittedHeight = computed(() => naturalHeight.value ? naturalHeight.value * fitScale.value : null);
const renderedWidth = computed(() => fittedWidth.value ? fittedWidth.value * zoom.value : null);
const renderedHeight = computed(() => fittedHeight.value ? fittedHeight.value * zoom.value : null);
const canDrag = computed(() => zoom.value > MIN_ZOOM);
const imageStyle = computed<CSSProperties>(() => ({
  width: fittedWidth.value ? `${fittedWidth.value}px` : undefined,
  height: fittedHeight.value ? `${fittedHeight.value}px` : undefined,
  transform: `translate3d(${offset.value.x}px, ${offset.value.y}px, 0) scale(${zoom.value})`,
  cursor: drag.value ? "grabbing" : canDrag.value ? "grab" : "default",
}));

watch(() => props.source.src, resetView, { immediate: true });
watch(
  () => [fittedWidth.value, fittedHeight.value, stageSize.value.width, stageSize.value.height],
  normalizeOffset,
);

onMounted(() => {
  disposed = false;
  overlayPresence.activate();
  updateStageSize();
  if (typeof ResizeObserver === "function" && stageRef.value) {
    resizeObserver = new ResizeObserver(updateStageSize);
    resizeObserver.observe(stageRef.value);
  }
  unlistenWindowResize = addDomEventListener(window, "resize", updateStageSize);
});

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  unlistenWindowResize?.();
  overlayPresence.deactivate();
});

function close() {
  emit("close");
}

function resetView() {
  naturalWidth.value = null;
  naturalHeight.value = null;
  zoom.value = MIN_ZOOM;
  offset.value = { x: 0, y: 0 };
  drag.value = null;
  void nextTick(updateStageSize);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampAxisOffset(value: number, renderedSize: number | null, viewportSize: number) {
  if (!renderedSize || !viewportSize) return 0;
  const requiredCoverage = viewportSize * MIN_VISIBLE_COVERAGE_RATIO;
  if (renderedSize < requiredCoverage) return 0;
  const max = (viewportSize + renderedSize) / 2 - requiredCoverage;
  return clamp(value, -max, max);
}

function clampOffset(value: { x: number; y: number }) {
  if (!canDrag.value) return { x: 0, y: 0 };
  return {
    x: clampAxisOffset(value.x, renderedWidth.value, stageSize.value.width),
    y: clampAxisOffset(value.y, renderedHeight.value, stageSize.value.height),
  };
}

function normalizeOffset() {
  offset.value = clampOffset(offset.value);
}

function updateStageSize() {
  if (disposed || !stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  stageSize.value = {
    width: rect.width || stageRef.value.clientWidth,
    height: rect.height || stageRef.value.clientHeight,
  };
}

function onImageLoad(event: Event) {
  const image = event.currentTarget;
  if (!(image instanceof HTMLImageElement)) return;
  naturalWidth.value = image.naturalWidth || null;
  naturalHeight.value = image.naturalHeight || null;
  updateStageSize();
  void nextTick(updateStageSize);
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const nextZoom = clamp(
    zoom.value * (1 - event.deltaY * WHEEL_SCALE_STEP),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  if (Math.abs(nextZoom - zoom.value) < 0.001) return;
  zoom.value = nextZoom;
  normalizeOffset();
}

function onPointerDown(event: PointerEvent) {
  if (!canDrag.value || event.button !== 0) return;
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  drag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: offset.value.x,
    originY: offset.value.y,
  };
}

function onPointerMove(event: PointerEvent) {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return;
  offset.value = clampOffset({
    x: drag.value.originX + event.clientX - drag.value.startX,
    y: drag.value.originY + event.clientY - drag.value.startY,
  });
}

function clearDrag(event?: PointerEvent) {
  if (!drag.value) return;
  if (event?.currentTarget instanceof HTMLElement) {
    try {
      event.currentTarget.releasePointerCapture?.(drag.value.pointerId);
    } catch {
      // The browser may have released pointer capture already.
    }
  }
  drag.value = null;
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="overlayRef"
      class="ui-image-viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="source.alt || source.name || '图片查看器'"
      :data-agent-id="agentId"
      tabindex="-1"
      @click="dialog.onOutsidePointer"
      @keydown="dialog.onKeydown"
      @wheel="onWheel"
    >
      <button
        type="button"
        class="ui-image-viewer__close"
        aria-label="关闭图片"
        :data-agent-id="agentId ? `${agentId}.close` : undefined"
        @click="close"
      >
        <X :size="18" aria-hidden="true" />
      </button>
      <figure class="ui-image-viewer__figure" @click.stop>
        <div ref="stageRef" class="ui-image-viewer__stage">
          <img
            class="ui-image-viewer__image"
            :src="source.src"
            :alt="source.alt || source.name || '图片'"
            :style="imageStyle"
            :data-agent-id="agentId ? `${agentId}.image` : undefined"
            draggable="false"
            @load="onImageLoad"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="clearDrag"
            @pointercancel="clearDrag"
            @lostpointercapture="clearDrag"
          >
        </div>
        <figcaption v-if="source.name || source.metadata" class="ui-image-viewer__meta">
          <span v-if="source.name" class="ui-image-viewer__name">{{ source.name }}</span>
          <span v-if="source.metadata">{{ source.metadata }}</span>
        </figcaption>
      </figure>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-image-viewer {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 82%, rgba(0, 0, 0, 0.84));
  color: var(--text);
}

.ui-image-viewer__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-elev);
  color: var(--text-muted);
  cursor: pointer;
}

.ui-image-viewer__close:hover { background: var(--bg-hover); color: var(--text); }
.ui-image-viewer__close:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.ui-image-viewer__figure {
  width: min(calc(100% - 40px), 1080px);
  height: min(calc(100% - 40px), 760px);
  min-width: 0;
  min-height: 0;
  margin: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
  place-items: center;
}

.ui-image-viewer__stage {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  touch-action: none;
}

.ui-image-viewer__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border-radius: 5px;
  user-select: none;
  transform-origin: center;
  transition: transform 0.08s ease;
}

.ui-image-viewer__meta {
  max-width: 100%;
  min-height: 20px;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.ui-image-viewer__name {
  max-width: min(520px, 80vw);
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .ui-image-viewer__image { transition: none; }
}
</style>
