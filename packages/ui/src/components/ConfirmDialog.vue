<script setup lang="ts">
import AlertTriangle from "@lucide/vue/dist/esm/icons/triangle-alert.mjs";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref, watch } from "vue";
import UiButton from "./UiButton.vue";

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  secondaryText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  busyText?: string;
}>(), {
  confirmText: "确认",
  secondaryText: undefined,
  cancelText: "取消",
  danger: false,
  busy: false,
  busyText: "处理中...",
});

const emit = defineEmits<{
  confirm: [];
  secondary: [];
  cancel: [];
}>();

const overlay = ref<HTMLElement | null>(null);

function cancel() {
  if (props.busy) return;
  emit("cancel");
}

const dialog = useDialogPrimitive(
  {
    get open() { return props.open; },
    closeOnEscape: true,
    closeOnOutside: true,
    initialFocus: "first-action",
  },
  overlay,
  cancel,
  () => overlay.value?.querySelector<HTMLButtonElement>(
    `[data-agent-id="${props.danger ? "confirm-dialog.cancel" : "confirm-dialog.confirm"}"]:not(:disabled)`,
  ) ?? null,
);

watch(() => props.busy, (busy, wasBusy) => {
  if (!props.open || !wasBusy || busy) return;
  overlay.value?.querySelector<HTMLButtonElement>(
    `[data-agent-id="${props.danger ? "confirm-dialog.cancel" : "confirm-dialog.confirm"}"]:not(:disabled)`,
  )?.focus();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        ref="overlay"
        class="modal-overlay"
        data-lilia-surface-mode="translucent"
        data-lilia-backdrop="css-blur"
        data-lilia-surface-level="overlay"
        data-lilia-surface-boundary
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        data-agent-id="confirm-dialog"
        tabindex="-1"
        @click="dialog.onOutsidePointer"
        @keydown="dialog.onKeydown"
      >
        <div class="modal-card dialog-card" data-lilia-surface-mode="solid" data-lilia-backdrop="none" data-lilia-surface-level="floating" data-lilia-surface-boundary>
          <div class="dialog-card__header" :class="{ 'dialog-card__header--danger': danger }">
            <AlertTriangle v-if="danger" :size="14" aria-hidden="true" />
            <span>{{ title }}</span>
          </div>
          <div class="dialog-card__body">
            <p>{{ message }}</p>
          </div>
          <div class="dialog-card__actions">
            <UiButton
              variant="ghost"
              :disabled="busy"
              agent-id="confirm-dialog.cancel"
              @click="cancel"
            >
              {{ cancelText }}
            </UiButton>
            <UiButton
              v-if="secondaryText"
              variant="ghost"
              :disabled="busy"
              agent-id="confirm-dialog.secondary"
              @click="emit('secondary')"
            >
              {{ secondaryText }}
            </UiButton>
            <UiButton
              :variant="danger ? 'danger' : 'primary'"
              :busy="busy"
              agent-id="confirm-dialog.confirm"
              @click="emit('confirm')"
            >
              {{ busy ? busyText : confirmText }}
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: var(--scrim);
  --lilia-surface-css-blur: 2px;
}

.modal-card {
  width: min(520px, 92vw);
  max-height: 72vh;
  overflow: hidden;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dialog);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.16s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.16s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.dialog-card {
  display: flex;
  flex-direction: column;
}

.dialog-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 8px;
  font-weight: 600;
}

.dialog-card__header--danger {
  color: var(--err);
}

.dialog-card__body {
  padding: 4px 16px 12px;
}

.dialog-card__body p {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}

.dialog-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 16px 14px;
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-card,
  .modal-leave-active .modal-card {
    transition: none;
  }

  .modal-enter-from .modal-card,
  .modal-leave-to .modal-card {
    transform: none;
  }
}
</style>
