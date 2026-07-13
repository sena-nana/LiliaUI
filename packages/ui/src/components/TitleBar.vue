<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import Copy from "@lucide/vue/dist/esm/icons/copy.mjs";
import Minus from "@lucide/vue/dist/esm/icons/minus.mjs";
import PanelLeftClose from "@lucide/vue/dist/esm/icons/panel-left-close.mjs";
import PanelLeftOpen from "@lucide/vue/dist/esm/icons/panel-left-open.mjs";
import Square from "@lucide/vue/dist/esm/icons/square.mjs";
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import { useNativeWindowChrome } from "../composables/useNativeWindowChrome";
import { useTauriWindowControls } from "../composables/useTauriWindowControls";

interface Props {
  title?: string;
  leftSidebarCollapsed?: boolean;
  sidebarTogglesDisabled?: boolean;
}

withDefaults(defineProps<Props>(), { title: "" });

defineEmits<{
  toggleLeftSidebar: [];
}>();

const {
  close: onClose,
  isMaximized,
  minimize: onMinimize,
  startDragging: startNativeDrag,
  toggleMaximize: onToggleMaximize,
} = useTauriWindowControls({ trackMaximized: true });
const { chrome } = useNativeWindowChrome();
const usesCustomWindowControls = computed(() => chrome.value.controls === "custom");
const chromeInsets = computed(() => ({
  "--lilia-titlebar-leading-inset": `${chrome.value.leadingInset}px`,
  "--lilia-titlebar-trailing-inset": `${chrome.value.trailingInset}px`,
}));
const DRAG_THRESHOLD = 4;
let pendingDrag: {
  pointerId: number;
  startX: number;
  startY: number;
  target: HTMLElement | null;
} | null = null;

onUnmounted(() => {
  clearPendingDrag();
});

function isTitlebarControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, [contenteditable='true']"))
  );
}

function clearPendingDrag() {
  if (pendingDrag?.target?.hasPointerCapture?.(pendingDrag.pointerId)) {
    pendingDrag.target.releasePointerCapture(pendingDrag.pointerId);
  }
  pendingDrag = null;
}

function trackDrag(event: PointerEvent) {
  clearPendingDrag();
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  target?.setPointerCapture?.(event.pointerId);
  pendingDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    target,
  };
}

function onTitlebarPointerMove(event: PointerEvent) {
  if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;
  const deltaX = event.clientX - pendingDrag.startX;
  const deltaY = event.clientY - pendingDrag.startY;
  if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
  clearPendingDrag();
  void startNativeDrag();
}

function onTitlebarPointerDown(event: PointerEvent) {
  if (event.button !== 0 || (event.pointerType && event.pointerType !== "mouse")) return;
  if (isTitlebarControl(event.target)) return;
  trackDrag(event);
}
</script>

<template>
  <header
    data-agent-id="titlebar"
    class="titlebar"
    :style="chromeInsets"
    @pointerdown="onTitlebarPointerDown"
    @pointermove="onTitlebarPointerMove"
    @pointerup="clearPendingDrag"
    @pointercancel="clearPendingDrag"
  >
    <div class="titlebar__left-controls" data-agent-id="titlebar.left-controls">
      <button
        data-agent-id="titlebar.left-sidebar.toggle"
        type="button"
        class="titlebar__btn titlebar__left-sidebar-btn"
        :aria-label="leftSidebarCollapsed ? '展开左侧栏' : '折叠左侧栏'"
        :title="leftSidebarCollapsed ? '展开左侧栏' : '折叠左侧栏'"
        :aria-pressed="leftSidebarCollapsed"
        :disabled="sidebarTogglesDisabled"
        @click="$emit('toggleLeftSidebar')"
      >
        <PanelLeftOpen
          v-if="leftSidebarCollapsed"
          :size="15"
          aria-hidden="true"
        />
        <PanelLeftClose
          v-else
          :size="15"
          aria-hidden="true"
        />
      </button>
    </div>
    <div class="titlebar__center" data-agent-id="titlebar.center">
      <slot name="center">
        <span class="titlebar__brand" data-agent-id="titlebar.brand">{{ title }}</span>
      </slot>
    </div>
    <div class="titlebar__controls" data-agent-id="titlebar.window-controls">
      <slot name="right-actions" />
      <button
        v-if="usesCustomWindowControls"
        data-agent-id="titlebar.window.minimize"
        type="button"
        class="titlebar__btn"
        aria-label="最小化"
        @click="onMinimize"
      >
        <Minus :size="14" aria-hidden="true" />
      </button>
      <button
        v-if="usesCustomWindowControls"
        data-agent-id="titlebar.window.maximize"
        type="button"
        class="titlebar__btn"
        :aria-label="isMaximized ? '还原' : '最大化'"
        @click="onToggleMaximize"
      >
        <Copy v-if="isMaximized" :size="13" aria-hidden="true" />
        <Square v-else :size="13" aria-hidden="true" />
      </button>
      <button
        v-if="usesCustomWindowControls"
        data-agent-id="titlebar.window.close"
        type="button"
        class="titlebar__btn titlebar__btn--danger"
        aria-label="关闭"
        @click="onClose"
      >
        <X :size="15" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  height: var(--lilia-titlebar-height, 36px);
  background: var(--bg-elev);
  user-select: none;
  -webkit-user-select: none;
}

.titlebar__left-controls {
  display: flex;
  align-items: center;
  justify-self: start;
  gap: 2px;
  padding: 0 6px 0 calc(6px + var(--lilia-titlebar-leading-inset, 0px));
  -webkit-app-region: no-drag;
}

.titlebar__center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  min-width: 0;
  max-width: min(420px, 44vw);
}

.titlebar__brand {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: var(--text);
}

.titlebar__controls {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 2px;
  padding: 0 calc(6px + var(--lilia-titlebar-trailing-inset, 0px)) 0 6px;
  -webkit-app-region: no-drag;
}

.titlebar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.titlebar__btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.titlebar__btn--danger:hover {
  background: var(--err-soft);
  color: var(--err);
}

.titlebar__controls :slotted(.titlebar__btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.titlebar__controls :slotted(.titlebar__btn:hover) {
  background: var(--bg-hover);
  color: var(--text);
}
</style>
