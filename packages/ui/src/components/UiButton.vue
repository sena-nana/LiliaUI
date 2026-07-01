<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: "ghost" | "primary" | "danger";
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  icon?: unknown;
  disabled?: boolean;
  busy?: boolean;
  agentId?: string;
}>(), {
  variant: "ghost",
  size: "md",
  type: "button",
  icon: undefined,
  disabled: false,
  busy: false,
  agentId: undefined,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function onClick(event: MouseEvent) {
  if (props.disabled || props.busy) return;
  emit("click", event);
}
</script>

<template>
  <button
    :type="type"
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--${size}`,
      { 'is-busy': busy },
    ]"
    :disabled="disabled || busy"
    :data-agent-id="agentId"
    @click="onClick"
  >
    <slot name="icon">
      <component v-if="icon" :is="icon" :size="size === 'sm' ? 13 : 14" aria-hidden="true" />
    </slot>
    <span v-if="$slots.default" class="ui-button__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.ui-button {
  min-width: 0;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  transition: background-color 0.12s ease, color 0.12s ease, opacity 0.12s ease;
}

.ui-button--md {
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.ui-button--sm {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

.ui-button--ghost {
  background: transparent;
  color: var(--text);
}

.ui-button--ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  filter: none;
}

.ui-button--primary {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.ui-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent);
  filter: none;
}

.ui-button--danger {
  background: transparent;
  color: var(--err);
}

.ui-button--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--err) 18%, transparent);
  filter: none;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  filter: none;
}

.ui-button__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
