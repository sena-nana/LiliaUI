<script setup lang="ts">
import { ArrowLeft, Minimize2, Plus, X } from "@lucide/vue";
import { useTauriWindowControls } from "../composables/useTauriWindowControls";

const emit = defineEmits<{
  close: [];
  focusMain: [];
  newItem: [];
}>();

const props = withDefaults(defineProps<{
  closeWindow?: boolean;
}>(), {
  closeWindow: true,
});

const { close, minimize } = useTauriWindowControls();

async function onClose() {
  emit("close");
  if (props.closeWindow) await close();
}
</script>

<template>
  <header class="popup-titlebar" data-agent-id="popup.titlebar" data-tauri-drag-region>
    <div class="popup-titlebar__controls popup-titlebar__controls--left">
      <slot name="left-actions">
        <button
          type="button"
          class="titlebar__btn"
          data-agent-id="popup.titlebar.focus-main"
          aria-label="回到主窗口"
          title="回到主窗口"
          @click="emit('focusMain')"
        >
          <ArrowLeft :size="15" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="titlebar__btn"
          data-agent-id="popup.titlebar.new"
          aria-label="新建"
          title="新建"
          @click="emit('newItem')"
        >
          <Plus :size="15" aria-hidden="true" />
        </button>
      </slot>
    </div>
    <div class="popup-titlebar__crumbs" data-tauri-drag-region>
      <slot />
    </div>
    <div class="popup-titlebar__controls popup-titlebar__controls--right">
      <slot name="right-actions">
        <button
          type="button"
          class="titlebar__btn"
          data-agent-id="popup.titlebar.minimize"
          aria-label="最小化"
          title="最小化"
          @click="minimize"
        >
          <Minimize2 :size="14" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="titlebar__btn titlebar__btn--danger"
          data-agent-id="popup.titlebar.close"
          aria-label="关闭"
          title="关闭"
          @click="onClose"
        >
          <X :size="15" aria-hidden="true" />
        </button>
      </slot>
    </div>
  </header>
</template>
