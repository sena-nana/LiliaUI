<script setup lang="ts">
/**
 * 预设确认对话框：danger/secondary/busy 变体，初始焦点随 danger 切换到取消或确认按钮。
 * 基于 `UiDialog`；需要完全自定义内容/页脚时直接使用 `UiDialog`。
 */
import AlertTriangle from "@lucide/vue/dist/esm/icons/triangle-alert.mjs";
import UiButton from "./UiButton.vue";
import UiDialog from "./UiDialog.vue";

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

function cancel() {
  if (props.busy) return;
  emit("cancel");
}

const focusTargetAgentId = () => (props.danger ? "confirm-dialog.cancel" : "confirm-dialog.confirm");
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    agent-id="confirm-dialog"
    close-hidden
    :close-disabled="busy"
    :initial-focus-agent-id="focusTargetAgentId()"
    @close="cancel"
  >
    <p class="confirm-dialog__message">{{ message }}</p>
    <template #title>
      <span class="confirm-dialog__title" :class="{ 'confirm-dialog__title--danger': danger }">
        <AlertTriangle v-if="danger" :size="14" aria-hidden="true" />
        <span>{{ title }}</span>
      </span>
    </template>
    <template #footer>
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
    </template>
  </UiDialog>
</template>

<style scoped>
.confirm-dialog__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.confirm-dialog__title--danger {
  color: var(--err);
}

.confirm-dialog__message {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}
</style>
