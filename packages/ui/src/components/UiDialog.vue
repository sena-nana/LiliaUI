<script setup lang="ts">
/**
 * 通用模态对话框：标题/描述/正文/页脚 slot，支持 ESC、外部点击关闭与焦点陷阱。
 * 危险或带 busy 态的确认场景改用 `ConfirmDialog`（基于此组件的预设变体）。
 */
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { DialogProps, OpenStateEmits } from "@lilia/ui-contract";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref, watch } from "vue";
import { useOverlayPresence } from "../composables/useOverlayActivity";
import "./overlay.css";

const props = withDefaults(defineProps<DialogProps & { closeHidden?: boolean; initialFocusAgentId?: string }>(), {
  description: undefined,
  size: "default",
  closeOnEscape: true,
  closeOnOutside: true,
  closeDisabled: false,
  closeAgentId: undefined,
  closeLabel: "关闭",
  closeHidden: false,
  initialFocus: "first-action",
  agentId: undefined,
  initialFocusAgentId: undefined,
});
const emit = defineEmits<OpenStateEmits>();
const overlay = ref<HTMLElement | null>(null);
const overlayPresence = useOverlayPresence();

function close() {
  if (props.closeDisabled) return;
  emit("update:open", false);
  emit("close");
}

const dialog = useDialogPrimitive(props, overlay, close, () => {
  if (props.initialFocusAgentId) {
    return overlay.value?.querySelector<HTMLElement>(
      `[data-agent-id="${props.initialFocusAgentId}"]:not(:disabled)`,
    ) ?? null;
  }
  return null;
});

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
        <div class="ui-overlay__surface ui-dialog__surface" :class="`ui-dialog__surface--${size}`">
          <header class="ui-overlay__header">
            <div class="ui-overlay__heading">
              <h2 class="ui-overlay__title"><slot name="title">{{ title }}</slot></h2>
              <p v-if="description" class="ui-overlay__description">{{ description }}</p>
            </div>
            <button
              v-if="!closeHidden"
              class="ui-overlay__close"
              type="button"
              :aria-label="closeLabel"
              :data-agent-id="closeAgentId"
              :disabled="closeDisabled"
              @click="close"
            >
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
