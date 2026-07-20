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
  type WorkspaceLayoutModel,
  type WorkspaceRegionLayout,
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
const registrations = shallowRef<WorkspaceRegionRegistration[]>([]);
const registrationsById = new Map<string, WorkspaceRegionRegistration>();
const geometryStates = new Map<string, WorkspaceGeometryState>();

function sameRegionLayout(left: WorkspaceRegionLayout, right: WorkspaceRegionLayout) {
  if (
    left.visible !== right.visible
    || left.overlay !== right.overlay
    || left.separator !== right.separator
    || left.edgeStart !== right.edgeStart
    || left.edgeEnd !== right.edgeEnd
    || left.edgeTop !== right.edgeTop
    || left.edgeBottom !== right.edgeBottom
  ) return false;
  const leftStyle = left.style as Record<string, unknown>;
  const rightStyle = right.style as Record<string, unknown>;
  const leftKeys = Object.keys(leftStyle);
  const rightKeys = Object.keys(rightStyle);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => leftStyle[key] === rightStyle[key]);
}

const layout = shallowRef<WorkspaceLayoutModel>(createWorkspaceLayout([], 0));

function commitLayout() {
  const next = createWorkspaceLayout(registrations.value, inlineSize.value);
  const regions = next.regions as Map<symbol, WorkspaceRegionLayout>;
  for (const [key, region] of regions) {
    const previous = layout.value.regions.get(key);
    if (previous && sameRegionLayout(previous, region)) regions.set(key, previous);
  }
  layout.value = next;
}
const workspaceStyle = computed(() => ({
  gridTemplateColumns: layout.value.columns,
  gridTemplateRows: layout.value.rows,
}));
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
const observedElements = new Set<Element>();
let measureFrame: number | null = null;
let stableFrame: number | null = null;
let layoutRefreshQueued = false;

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
    overlayOccluded: ref(false),
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

function hasGeometrySubscribers() {
  for (const state of geometryStates.values()) {
    if (state.subscribers > 0) return true;
  }
  return false;
}

function reconcileRegionObservers(measuredElements: ReadonlySet<Element>) {
  for (const element of [...observedElements]) {
    if (element !== root.value && !measuredElements.has(element)) unobserve(element);
  }
  for (const element of measuredElements) observe(element);
}

function isOverlayOccluded(
  targetKey: symbol,
  safeRect: DOMRectReadOnly,
  overlayRects: ReadonlyMap<symbol, DOMRectReadOnly>,
) {
  for (const [key, overlayRect] of overlayRects) {
    if (
      key !== targetKey
      && safeRect.left < overlayRect.right
      && safeRect.right > overlayRect.left
      && safeRect.top < overlayRect.bottom
      && safeRect.bottom > overlayRect.top
    ) return true;
  }
  return false;
}

function measureGeometry() {
  measureFrame = null;
  const workspaceElement = root.value;
  if (!workspaceElement) return;
  const workspaceRect = workspaceElement.getBoundingClientRect();
  if (inlineSize.value !== workspaceRect.width) {
    inlineSize.value = workspaceRect.width;
    refreshLayout();
  }
  const measuredElements = new Set<Element>();
  const subscribedRegistrations = registrations.value.filter((registration) => (
    (geometryStates.get(registration.id)?.subscribers ?? 0) > 0
  ));
  const visibleSubscriptions: Array<{
    element: HTMLElement;
    registration: WorkspaceRegionRegistration;
    state: WorkspaceGeometryState;
  }> = [];
  for (const registration of subscribedRegistrations) {
    const state = geometryStates.get(registration.id);
    if (!state) continue;
    const regionLayout = layout.value.regions.get(registration.key);
    const element = registration.element.value;
    const visible = Boolean(regionLayout?.visible && element?.isConnected);
    state.visible.value = visible;
    if (!visible || !element) {
      state.rect.value = null;
      state.safeRect.value = null;
      state.overlayOccluded.value = false;
      continue;
    }
    visibleSubscriptions.push({ element, registration, state });
  }
  const overlayRects = new Map<symbol, DOMRectReadOnly>();
  if (visibleSubscriptions.length > 0) {
    for (const registration of registrations.value) {
      const regionLayout = layout.value.regions.get(registration.key);
      const element = registration.element.value;
      if (!regionLayout?.visible || !regionLayout.overlay || !element?.isConnected) continue;
      overlayRects.set(registration.key, element.getBoundingClientRect());
      measuredElements.add(element);
    }
  }
  for (const { element, registration, state } of visibleSubscriptions) {
    const rect = overlayRects.get(registration.key) ?? element.getBoundingClientRect();
    measuredElements.add(element);
    const safeRect = intersectRects(rect, workspaceRect);
    state.rect.value = rect;
    state.safeRect.value = safeRect;
    state.overlayOccluded.value = isOverlayOccluded(registration.key, safeRect, overlayRects);
  }
  reconcileRegionObservers(measuredElements);
  stableFrame = requestFrame(() => {
    stableFrame = null;
    for (const state of geometryStates.values()) state.stable.value = true;
  });
}

function refreshGeometry() {
  if (!root.value) return;
  if (measureFrame !== null) return;
  for (const state of geometryStates.values()) state.stable.value = false;
  cancelFrame(stableFrame);
  stableFrame = null;
  measureFrame = requestFrame(measureGeometry);
}

function flushLayoutRefresh() {
  layoutRefreshQueued = false;
  const workspaceElement = root.value;
  if (workspaceElement) {
    const registrationByElement = new Map<Element, WorkspaceRegionRegistration>();
    for (const registration of registrations.value) {
      const element = registration.element.value;
      if (element) registrationByElement.set(element, registration);
    }
    const ordered: WorkspaceRegionRegistration[] = [];
    for (const element of workspaceElement.children) {
      const registration = registrationByElement.get(element);
      if (registration) ordered.push(registration);
    }
    const orderedRegistrations = new Set(ordered);
    for (const registration of registrations.value) {
      if (!orderedRegistrations.has(registration)) ordered.push(registration);
    }
    const orderChanged = ordered.some((registration, index) => registration !== registrations.value[index]);
    if (orderChanged) {
      registrations.value.splice(0, registrations.value.length, ...ordered);
    }
  }
  commitLayout();
  refreshGeometry();
}

function refreshLayout() {
  if (layoutRefreshQueued) return;
  layoutRefreshQueued = true;
  queueMicrotask(flushLayoutRefresh);
}

function registerRegion(registration: WorkspaceRegionRegistration) {
  if (registrationsById.has(registration.id)) {
    throw new Error(`Duplicate LiliaWorkspaceRegion id: ${registration.id}`);
  }
  registrationsById.set(registration.id, registration);
  registrations.value.push(registration);
  refreshLayout();
  return () => {
    unobserve(registration.element.value);
    registrationsById.delete(registration.id);
    const index = registrations.value.indexOf(registration);
    if (index >= 0) {
      registrations.value.splice(index, 1);
    }
    const state = geometryStates.get(registration.id);
    if (state) {
      state.visible.value = false;
      state.rect.value = null;
      state.safeRect.value = null;
      state.overlayOccluded.value = false;
      state.stable.value = true;
      if (state.subscribers === 0) geometryStates.delete(registration.id);
    }
    refreshLayout();
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
      state.rect.value = null;
      state.safeRect.value = null;
      state.overlayOccluded.value = false;
      state.visible.value = false;
      state.stable.value = true;
      const registration = registrationsById.get(id);
      if (!registration) geometryStates.delete(id);
      if (hasGeometrySubscribers()) refreshGeometry();
      else reconcileRegionObservers(new Set());
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
  registrationsById.clear();
  geometryStates.clear();
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
