<script setup lang="ts">
import Copy from "@lucide/vue/dist/esm/icons/copy.mjs";
import Minus from "@lucide/vue/dist/esm/icons/minus.mjs";
import Square from "@lucide/vue/dist/esm/icons/square.mjs";
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import { onUnmounted } from "vue";
import { useTauriWindowControls } from "@lilia/ui-foundation/window-controls";

withDefaults(defineProps<{ title?: string; agentId?: string }>(), {
  title: "",
  agentId: "nana.shell.titlebar",
});

const controls = useTauriWindowControls({ trackMaximized: true });
const dragThreshold = 4;
let pendingDrag: { pointerId: number; startX: number; startY: number; target: HTMLElement | null } | null = null;

onUnmounted(clearPendingDrag);

function clearPendingDrag() {
  if (pendingDrag?.target?.hasPointerCapture?.(pendingDrag.pointerId)) {
    pendingDrag.target.releasePointerCapture(pendingDrag.pointerId);
  }
  pendingDrag = null;
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button, a, input"))) return;
  clearPendingDrag();
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  target?.setPointerCapture?.(event.pointerId);
  pendingDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, target };
}

function onPointerMove(event: PointerEvent) {
  if (!pendingDrag || pendingDrag.pointerId !== event.pointerId) return;
  if (Math.hypot(event.clientX - pendingDrag.startX, event.clientY - pendingDrag.startY) < dragThreshold) return;
  clearPendingDrag();
  void controls.startDragging();
}
</script>

<template>
  <div
    class="nana-titlebar"
    :data-agent-id="agentId"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="clearPendingDrag"
    @pointercancel="clearPendingDrag"
    @dblclick="controls.toggleMaximize"
  >
    <div class="nana-titlebar__leading"><slot name="leading" /></div>
    <div class="nana-titlebar__title"><slot name="center">{{ title }}</slot></div>
    <div class="nana-titlebar__controls">
      <div v-if="$slots.actions" class="nana-titlebar__actions"><slot name="actions" /></div>
      <button type="button" aria-label="最小化" data-agent-id="nana.window.minimize" @click="controls.minimize"><Minus :size="14" /></button>
      <button type="button" :aria-label="controls.isMaximized.value ? '还原' : '最大化'" data-agent-id="nana.window.maximize" @click="controls.toggleMaximize">
        <Copy v-if="controls.isMaximized.value" :size="13" /><Square v-else :size="12" />
      </button>
      <button type="button" class="is-close" aria-label="关闭" data-agent-id="nana.window.close" @click="controls.close"><X :size="15" /></button>
    </div>
  </div>
</template>
