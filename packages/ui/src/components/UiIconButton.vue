<script setup lang="ts">
import UiButton from "./UiButton.vue";
import type { UiButtonSize, UiButtonVariant } from "./UiButton.vue";
import UiSpinner from "./UiSpinner.vue";

const props = withDefaults(defineProps<{
  icon: unknown;
  label: string;
  title?: string;
  size?: UiButtonSize;
  variant?: UiButtonVariant;
  active?: boolean;
  disabled?: boolean;
  busy?: boolean;
  agentId?: string;
}>(), {
  title: undefined,
  size: "md",
  variant: "ghost",
  active: false,
  disabled: false,
  busy: false,
  agentId: undefined,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <UiButton
    class="ui-icon-button"
    :class="[
      `ui-icon-button--${size}`,
      `ui-icon-button--${variant}`,
      { 'is-active': active, 'is-busy': busy },
    ]"
    :variant="variant"
    :size="size"
    :aria-label="label"
    :title="title ?? label"
    :disabled="disabled"
    :busy="busy"
    :agent-id="agentId"
    @click="emit('click', $event)"
  >
    <template #icon>
      <UiSpinner v-if="busy" :size="size === 'sm' ? 13 : 14" :label="label" />
      <component v-else :is="icon" :size="size === 'sm' ? 13 : 14" aria-hidden="true" />
    </template>
  </UiButton>
</template>

<style scoped>
.ui-icon-button.ui-button {
  flex: 0 0 auto;
  color: var(--text-muted);
  padding: 0;
  gap: 0;
}

.ui-icon-button--md.ui-button {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
}

.ui-icon-button--sm.ui-button {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
}

.ui-icon-button.ui-button:hover:not(:disabled),
.ui-icon-button.ui-button.is-active {
  background: var(--bg-hover);
  color: var(--text);
  filter: none;
}

.ui-icon-button--primary.ui-button.is-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.ui-icon-button--warning.ui-button {
  color: var(--warn);
}

.ui-icon-button--warning.ui-button:hover:not(:disabled),
.ui-icon-button--warning.ui-button.is-active {
  background: var(--warn-soft);
  color: var(--warn);
}

.ui-icon-button--danger.ui-button {
  color: var(--err);
}

.ui-icon-button--danger.ui-button:hover:not(:disabled),
.ui-icon-button--danger.ui-button.is-active {
  background: color-mix(in srgb, var(--err) 18%, transparent);
  color: var(--err);
}
</style>
