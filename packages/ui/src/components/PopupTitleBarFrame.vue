<script setup lang="ts">
import { ArrowLeft, Minimize2, Plus, X } from "@lucide/vue";
import { useTauriWindowControls } from "../composables/useTauriWindowControls";
import UiIconButton from "./UiIconButton.vue";
import "./popup-titlebar-frame.css";

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
        <UiIconButton
          class="titlebar__btn"
          :icon="ArrowLeft"
          label="回到主窗口"
          agent-id="popup.titlebar.focus-main"
          @click="emit('focusMain')"
        />
        <UiIconButton
          class="titlebar__btn"
          :icon="Plus"
          label="新建"
          agent-id="popup.titlebar.new"
          @click="emit('newItem')"
        />
      </slot>
    </div>
    <div class="popup-titlebar__crumbs" data-tauri-drag-region>
      <slot />
    </div>
    <div class="popup-titlebar__controls popup-titlebar__controls--right">
      <slot name="right-actions">
        <UiIconButton
          class="titlebar__btn"
          :icon="Minimize2"
          label="最小化"
          agent-id="popup.titlebar.minimize"
          @click="minimize"
        />
        <UiIconButton
          class="titlebar__btn titlebar__btn--danger"
          :icon="X"
          label="关闭"
          agent-id="popup.titlebar.close"
          @click="onClose"
        />
      </slot>
    </div>
  </header>
</template>
