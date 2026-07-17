<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { DialogProps } from "@lilia/ui-contract";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref, watch } from "vue";
import { useOverlayPresence } from "../composables/useOverlayActivity";
import "./overlay.css";

const props = withDefaults(defineProps<DialogProps>(), {
  description: undefined,
  closeOnEscape: true,
  closeOnOutside: true,
  initialFocus: "first-action",
  agentId: undefined,
});
const emit = defineEmits<{ "update:open": [open: boolean]; close: [] }>();
const overlay = ref<HTMLElement | null>(null);
const overlayPresence = useOverlayPresence();

function close() {
  emit("update:open", false);
  emit("close");
}

const dialog = useDialogPrimitive(props, overlay, close);

watch(() => props.open, (open) => {
  if (open) overlayPresence.activate();
}, { immediate: true });

function onAfterLeave() {
  if (!props.open) overlayPresence.deactivate();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-overlay-fade" @after-leave="onAfterLeave">
      <div
        v-if="open"
        ref="overlay"
        class="ui-overlay ui-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :data-agent-id="agentId"
        tabindex="-1"
        @click="dialog.onOutsidePointer"
        @keydown="dialog.onKeydown"
      >
        <div class="ui-overlay__surface ui-dialog__surface">
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
