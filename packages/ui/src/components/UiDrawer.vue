<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { DrawerProps } from "@lilia/ui-contract";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref } from "vue";
import "./overlay.css";

const props = withDefaults(defineProps<DrawerProps>(), {
  description: undefined,
  side: "right",
  closeOnEscape: true,
  closeOnOutside: true,
  initialFocus: "first-action",
  agentId: undefined,
});
const emit = defineEmits<{ "update:open": [open: boolean]; close: [] }>();
const overlay = ref<HTMLElement | null>(null);

function close() {
  emit("update:open", false);
  emit("close");
}

const dialog = useDialogPrimitive(props, overlay, close);
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-overlay-fade">
      <div
        v-if="open"
        ref="overlay"
        class="ui-overlay ui-drawer"
        :class="`ui-drawer--${side}`"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :data-agent-id="agentId"
        tabindex="-1"
        @click="dialog.onOutsidePointer"
        @keydown="dialog.onKeydown"
      >
        <aside class="ui-overlay__surface ui-drawer__surface">
          <header class="ui-overlay__header">
            <div class="ui-overlay__heading">
              <h2 class="ui-overlay__title"><slot name="title">{{ title }}</slot></h2>
              <p v-if="description" class="ui-overlay__description">{{ description }}</p>
            </div>
            <button class="ui-overlay__close" type="button" aria-label="关闭" @click="close">
              <X :size="16" aria-hidden="true" />
            </button>
          </header>
          <div class="ui-overlay__body"><slot /></div>
          <footer v-if="$slots.footer || $slots.actions" class="ui-overlay__footer"><slot name="footer"><slot name="actions" /></slot></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
