<script setup lang="ts">
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  ref,
  useAttrs,
} from "vue";
import { workspaceContextKey, type WorkspaceRegionRegistration } from "./context";
import type { LiliaWorkspaceRegionProps, WorkspaceRegionPlacement } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<LiliaWorkspaceRegionProps>(), {
  placement: undefined,
  side: undefined,
  scope: "workspace",
  as: "section",
  size: undefined,
  defaultSize: undefined,
  minSize: 0,
  maxSize: 4096,
  fillPriority: 0,
  overflow: "auto",
  collapsible: false,
  collapsed: undefined,
  defaultCollapsed: false,
  resizable: false,
  hidden: false,
  disabled: false,
  narrowBehavior: "shrink",
  collapseBelow: undefined,
  responsivePriority: 0,
  resizeLabel: "调整区域尺寸",
  resizeStep: 8,
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "base",
  surfaceBoundary: true,
});

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  "update:size": [value: number];
  resizeStart: [value: number];
  resize: [value: number];
  resizeEnd: [value: number];
}>();

const attrs = useAttrs();
const regionAttributes = computed(() => ({
  ...attrs,
  ...resolveSurfaceAttributes(props),
}));
const injectedWorkspace = inject(workspaceContextKey);
if (!injectedWorkspace) throw new Error("LiliaWorkspaceRegion must be rendered inside LiliaWorkspace.");
const workspace = injectedWorkspace;

const element = shallowRef<HTMLElement | null>(null);
const internalCollapsed = ref(props.defaultCollapsed);
const initialSize = props.defaultSize ?? (["top", "bottom"].includes(props.placement ?? "") ? null : 240);
const internalSize = ref<number | null>(initialSize);
const isCollapsed = computed(() => props.collapsed ?? internalCollapsed.value);
const placement = computed<WorkspaceRegionPlacement>(() => props.placement ?? props.side ?? (
  props.role === "primary" ? "primary" : "start"
));
const currentSize = computed(() => {
  const candidate = props.size ?? internalSize.value;
  if (candidate === null || candidate === undefined) return null;
  return Math.min(props.maxSize, Math.max(props.minSize, candidate));
});
const requestedVisible = computed(() => !props.hidden && !isCollapsed.value);
const key = Symbol(props.id);
let pointer: { id: number; target: Element | null } | null = null;
let startCoordinate = 0;
let startSize = 0;
let latestResizeSize = 0;
let pendingCoordinate: number | null = null;
let resizeFrame: number | null = null;

const registration: WorkspaceRegionRegistration = {
  key,
  id: props.id,
  element,
  role: computed(() => props.role),
  placement,
  scope: computed(() => props.scope),
  size: currentSize,
  minSize: computed(() => props.minSize),
  maxSize: computed(() => props.maxSize),
  fillPriority: computed(() => props.fillPriority),
  narrowBehavior: computed(() => props.narrowBehavior),
  collapseBelow: computed(() => props.collapseBelow ?? null),
  responsivePriority: computed(() => props.responsivePriority),
  requestedVisible,
};

const unregister = workspace.registerRegion(registration);
const layout = computed(() => workspace.layout.value.regions.get(key));
const resizeOrientation = computed(() => ["start", "end", "primary"].includes(placement.value) ? "vertical" : "horizontal");
const resizeCursor = computed(() => resizeOrientation.value === "vertical" ? "col-resize" : "row-resize");
const canResize = computed(() => (
  props.resizable
  && props.fillPriority === 0
  && !props.disabled
  && requestedVisible.value
  && currentSize.value !== null
));
const regionStyle = computed(() => ({
  ...layout.value?.style,
  "--lilia-region-overflow": props.overflow,
  "--lilia-region-resize-cursor": resizeCursor.value,
  "--lilia-region-responsive-priority": props.responsivePriority,
}));
const resizeHandleStyle = computed(() => {
  const side = placement.value;
  return {
    [side === "start" || side === "primary" ? "insetInlineEnd" : side === "end" ? "insetInlineStart" : side === "top" ? "insetBlockEnd" : "insetBlockStart"]: "-4px",
  };
});

function setCollapsed(value: boolean) {
  if (!props.collapsible || props.disabled) return;
  internalCollapsed.value = value;
  emit("update:collapsed", value);
  workspace.refreshLayout();
}

function setSize(value: number, eventName: "resize" | "resizeEnd" = "resize") {
  const next = Math.min(props.maxSize, Math.max(props.minSize, value));
  internalSize.value = next;
  latestResizeSize = next;
  emit("update:size", next);
  if (eventName === "resize") emit("resize", next);
  else emit("resizeEnd", next);
  workspace.refreshLayout();
}

function coordinate(event: PointerEvent) {
  return resizeOrientation.value === "vertical" ? event.clientX : event.clientY;
}

function directionMultiplier() {
  return placement.value === "end" || placement.value === "bottom" ? -1 : 1;
}

function flushPointerResize() {
  if (resizeFrame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(resizeFrame);
  resizeFrame = null;
  if (pendingCoordinate === null) return;
  const delta = (pendingCoordinate - startCoordinate) * directionMultiplier();
  pendingCoordinate = null;
  setSize(startSize + delta);
}

function onPointerMove(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  pendingCoordinate = coordinate(event);
  if (typeof requestAnimationFrame !== "function") {
    flushPointerResize();
    return;
  }
  if (resizeFrame !== null) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    flushPointerResize();
  });
}

function stopResize(event?: PointerEvent) {
  if (!pointer || (event && event.pointerId !== pointer.id)) return;
  flushPointerResize();
  const finalSize = latestResizeSize;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
  window.removeEventListener("blur", onWindowBlur);
  if (pointer.target?.hasPointerCapture?.(pointer.id)) pointer.target.releasePointerCapture(pointer.id);
  pointer = null;
  emit("resizeEnd", finalSize);
}

function onWindowBlur() {
  stopResize();
}

function startResize(event: PointerEvent) {
  if (!canResize.value || event.button !== 0 || currentSize.value === null) return;
  event.preventDefault();
  startCoordinate = coordinate(event);
  startSize = currentSize.value;
  latestResizeSize = startSize;
  pendingCoordinate = null;
  const target = event.currentTarget instanceof Element ? event.currentTarget : null;
  target?.setPointerCapture?.(event.pointerId);
  pointer = { id: event.pointerId, target };
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
  window.addEventListener("blur", onWindowBlur);
  emit("resizeStart", startSize);
}

function onResizeKeydown(event: KeyboardEvent) {
  if (!canResize.value || currentSize.value === null) return;
  const step = event.shiftKey ? props.resizeStep * 3 : props.resizeStep;
  const horizontal = resizeOrientation.value === "horizontal";
  let next: number | null = null;
  if (event.key === "Home") next = props.minSize;
  else if (event.key === "End") next = props.maxSize;
  else if ((!horizontal && event.key === "ArrowLeft") || (horizontal && event.key === "ArrowUp")) {
    next = currentSize.value - step * directionMultiplier();
  } else if ((!horizontal && event.key === "ArrowRight") || (horizontal && event.key === "ArrowDown")) {
    next = currentSize.value + step * directionMultiplier();
  }
  if (next === null) return;
  event.preventDefault();
  setSize(next, "resizeEnd");
}

function resetSize() {
  if (!canResize.value) return;
  const resetValue = props.defaultSize ?? initialSize;
  if (resetValue !== null) setSize(resetValue, "resizeEnd");
}

onMounted(() => {
  workspace.refreshLayout();
});
watch(
  [
    () => props.role,
    placement,
    () => props.scope,
    currentSize,
    () => props.minSize,
    () => props.maxSize,
    () => props.fillPriority,
    () => props.narrowBehavior,
    () => props.collapseBelow,
    () => props.responsivePriority,
    requestedVisible,
  ],
  workspace.refreshLayout,
  { flush: "post" },
);
onBeforeUnmount(() => {
  stopResize();
  unregister();
});

defineExpose({
  collapsed: isCollapsed,
  size: currentSize,
  setCollapsed,
  setSize,
  toggleCollapsed: () => setCollapsed(!isCollapsed.value),
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="regionAttributes"
    ref="element"
    class="lilia-workspace-region"
    :style="regionStyle"
    :data-region-id="id"
    :data-agent-id="`workspace.region.${id}`"
    :data-region-role="role"
    :data-region-placement="placement"
    :data-region-scope="scope"
    :data-region-visible="layout?.visible ? 'true' : 'false'"
    :data-region-overlay="layout?.overlay ? 'true' : undefined"
    :data-region-separator="layout?.separator ?? undefined"
    :data-edge-start="layout?.edgeStart ? 'true' : undefined"
    :data-edge-end="layout?.edgeEnd ? 'true' : undefined"
    :data-edge-top="layout?.edgeTop ? 'true' : undefined"
    :data-edge-bottom="layout?.edgeBottom ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :hidden="!layout?.visible"
  >
    <div class="lilia-workspace-region__content">
      <slot
        :collapsed="isCollapsed"
        :disabled="disabled"
        :set-collapsed="setCollapsed"
        :size="currentSize"
        :toggle-collapsed="() => setCollapsed(!isCollapsed)"
      />
    </div>
    <div
      v-if="resizable && fillPriority === 0 && requestedVisible && currentSize !== null"
      class="lilia-workspace-region__resize-handle"
      :style="resizeHandleStyle"
      :data-agent-id="`workspace.region.${id}.resize`"
      role="separator"
      :tabindex="canResize ? 0 : -1"
      :aria-label="resizeLabel"
      :aria-orientation="resizeOrientation"
      :aria-disabled="canResize ? undefined : 'true'"
      :aria-valuenow="currentSize ?? undefined"
      :aria-valuemin="minSize"
      :aria-valuemax="maxSize"
      @pointerdown="startResize"
      @keydown="onResizeKeydown"
      @dblclick="resetSize"
    />
  </component>
</template>
