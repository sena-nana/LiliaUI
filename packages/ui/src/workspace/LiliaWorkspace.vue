<script setup lang="ts">
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
} from "vue";
import {
  workspaceContextKey,
  type WorkspaceGeometryState,
  type WorkspaceRegionRegistration,
} from "./context";
import { intersectRects } from "./geometry";
import type { LiliaWorkspaceProps } from "./types";
import { createWorkspaceLayout } from "./workspaceLayout";
import "../styles/workspace.css";

const props = withDefaults(defineProps<LiliaWorkspaceProps>(), {
  as: "div",
  agentId: "workspace",
  ariaLabel: undefined,
  shadow: false,
  surfaceMode: "solid",
  surfaceLevel: "base",
  surfaceBoundary: true,
});

const surfaceAttributes = computed(() => resolveSurfaceAttributes({
  surfaceMode: props.surfaceMode,
  backdropEffect: props.backdropEffect
    ?? (props.surfaceMode === "translucent" ? "native" : "none"),
  surfaceLevel: props.surfaceLevel,
  surfaceBoundary: props.surfaceBoundary,
}));

const root = shallowRef<HTMLElement | null>(null);
const inlineSize = ref(0);
const domOrderRevision = ref(0);
const registrations = shallowRef<WorkspaceRegionRegistration[]>([]);
const geometryStates = new Map<string, WorkspaceGeometryState>();
const layout = computed(() => {
  void domOrderRevision.value;
  return createWorkspaceLayout(registrations.value, inlineSize.value);
});
const workspaceStyle = computed(() => ({
  gridTemplateColumns: layout.value.columns,
  gridTemplateRows: layout.value.rows,
}));
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
const observedElements = new Set<Element>();
let measureFrame: number | null = null;
let stableFrame: number | null = null;
let nextRegionOrder = 0;

function requestFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
  return window.setTimeout(() => callback(performance.now()), 0);
}

function cancelFrame(frame: number | null) {
  if (frame === null) return;
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
  else window.clearTimeout(frame);
}

function getGeometry(id: string) {
  const existing = geometryStates.get(id);
  if (existing) return existing;
  const state: WorkspaceGeometryState = {
    id,
    subscribers: 0,
    rect: shallowRef(null),
    safeRect: shallowRef(null),
    visible: ref(false),
    stable: ref(false),
  };
  geometryStates.set(id, state);
  return state;
}

function observe(element: Element) {
  if (!resizeObserver || observedElements.has(element)) return;
  resizeObserver.observe(element);
  observedElements.add(element);
}

function unobserve(element: Element | null) {
  if (!element || !observedElements.delete(element)) return;
  resizeObserver?.unobserve(element);
}

function measureGeometry() {
  measureFrame = null;
  const workspaceElement = root.value;
  if (!workspaceElement) return;
  const workspaceRect = workspaceElement.getBoundingClientRect();
  inlineSize.value = workspaceRect.width;
  for (const registration of registrations.value) {
    const state = geometryStates.get(registration.id);
    if (!state || state.subscribers === 0) continue;
    const regionLayout = layout.value.regions.get(registration.key);
    const element = registration.element.value;
    const visible = Boolean(regionLayout?.visible && element?.isConnected);
    state.visible.value = visible;
    if (!visible || !element) {
      state.rect.value = null;
      state.safeRect.value = null;
      continue;
    }
    const rect = element.getBoundingClientRect();
    state.rect.value = rect;
    state.safeRect.value = intersectRects(rect, workspaceRect);
    observe(element);
  }
  stableFrame = requestFrame(() => {
    stableFrame = null;
    for (const state of geometryStates.values()) state.stable.value = true;
  });
}

function refreshGeometry() {
  for (const state of geometryStates.values()) state.stable.value = false;
  if (!root.value) return;
  cancelFrame(stableFrame);
  stableFrame = null;
  if (measureFrame !== null) return;
  measureFrame = requestFrame(measureGeometry);
}

function refreshLayout() {
  const workspaceElement = root.value;
  if (workspaceElement) {
    const children = Array.from(workspaceElement.children);
    for (const registration of registrations.value) {
      const element = registration.element.value;
      const index = element ? children.indexOf(element) : -1;
      if (index >= 0) registration.order = index;
    }
  }
  domOrderRevision.value += 1;
  refreshGeometry();
}

function registerRegion(registration: WorkspaceRegionRegistration) {
  if (registrations.value.some((item) => item.id === registration.id)) {
    throw new Error(`Duplicate LiliaWorkspaceRegion id: ${registration.id}`);
  }
  registration.order = nextRegionOrder;
  nextRegionOrder += 1;
  registrations.value = [...registrations.value, registration];
  refreshGeometry();
  return () => {
    unobserve(registration.element.value);
    registrations.value = registrations.value.filter((item) => item.key !== registration.key);
    const state = geometryStates.get(registration.id);
    if (state) {
      state.visible.value = false;
      state.rect.value = null;
      state.safeRect.value = null;
      state.stable.value = true;
    }
    refreshGeometry();
  };
}

function subscribeGeometry(id: string) {
  const state = getGeometry(id);
  state.subscribers += 1;
  refreshGeometry();
  let active = true;
  return {
    state,
    unsubscribe() {
      if (!active) return;
      active = false;
      state.subscribers = Math.max(0, state.subscribers - 1);
      if (state.subscribers > 0) return;
      const registration = registrations.value.find((item) => item.id === id);
      unobserve(registration?.element.value ?? null);
      state.rect.value = null;
      state.safeRect.value = null;
      state.visible.value = false;
      state.stable.value = true;
    },
  };
}

provide(workspaceContextKey, {
  inlineSize,
  layout,
  registerRegion,
  subscribeGeometry,
  refreshLayout,
  refreshGeometry,
});

onMounted(() => {
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(refreshGeometry);
    if (root.value) observe(root.value);
  }
  if (typeof MutationObserver === "function" && root.value) {
    mutationObserver = new MutationObserver(refreshLayout);
    mutationObserver.observe(root.value, { childList: true });
  }
  window.addEventListener("resize", refreshGeometry, { passive: true });
  window.visualViewport?.addEventListener("resize", refreshGeometry, { passive: true });
  measureGeometry();
});

onBeforeUnmount(() => {
  mutationObserver?.disconnect();
  mutationObserver = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  observedElements.clear();
  window.removeEventListener("resize", refreshGeometry);
  window.visualViewport?.removeEventListener("resize", refreshGeometry);
  cancelFrame(measureFrame);
  cancelFrame(stableFrame);
});

defineExpose({ refreshGeometry });
</script>

<template>
  <component
    :is="props.as"
    v-bind="surfaceAttributes"
    ref="root"
    class="lilia-workspace"
    :class="{ 'lilia-workspace--shadow': shadow }"
    :style="workspaceStyle"
    :aria-label="ariaLabel"
    :data-has-primary="layout.hasPrimary ? 'true' : 'false'"
    :data-agent-id="agentId"
  >
    <slot />
  </component>
</template>
