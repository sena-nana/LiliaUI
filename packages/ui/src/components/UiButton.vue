<script setup lang="ts">
import { useButtonPrimitive } from "@lilia/ui-foundation/button";
import type { ButtonEmits, ButtonProps, UIControlSize } from "@lilia/ui-contract";
import { Comment, Fragment, Text, computed, useSlots, type VNode } from "vue";

export type UiButtonVariant = "ghost" | "primary" | "secondary" | "text" | "warning" | "danger";
export type UiButtonSize = UIControlSize;
export type UiButtonType = "button" | "submit" | "reset";

const props = withDefaults(defineProps<Omit<ButtonProps, "variant" | "size"> & {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  type?: UiButtonType;
  icon?: unknown;
  disabled?: boolean;
  busy?: boolean;
  loading?: boolean;
  agentId?: string;
}>(), {
  variant: "ghost",
  size: "md",
  type: "button",
  icon: undefined,
  disabled: false,
  busy: false,
  loading: false,
  agentId: undefined,
});

const emit = defineEmits<ButtonEmits>();

const slots = useSlots();
const hasDefaultLabel = computed(() => hasRenderableSlotContent(slots.default?.() ?? []));
const hasIconContent = computed(() => Boolean(props.icon) || hasRenderableSlotContent(slots.icon?.() ?? []));
const isIconOnly = computed(() => hasIconContent.value && !hasDefaultLabel.value);
const button = useButtonPrimitive({
  get disabled() { return props.disabled; },
  get loading() { return props.busy || props.loading; },
});

function hasRenderableSlotContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false;
    if (node.type === Text) return String(node.children).trim().length > 0;
    if (node.type === Fragment) {
      return Array.isArray(node.children) && hasRenderableSlotContent(node.children as VNode[]);
    }
    return true;
  });
}

function onClick(event: MouseEvent) {
  if (!button.onPress(event)) return;
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
      { 'ui-button--icon-only': isIconOnly, 'is-busy': busy || loading },
    ]"
    :disabled="button.disabled.value"
    :aria-busy="button.ariaBusy.value"
    :aria-invalid="invalid || undefined"
    :data-agent-id="agentId"
    @click="onClick"
  >
    <slot name="icon">
      <component v-if="icon" :is="icon" :size="size === 'sm' ? 13 : 14" aria-hidden="true" />
    </slot>
    <span v-if="hasDefaultLabel" class="ui-button__label">
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

.ui-button--lg {
  height: 38px;
  padding: 0 14px;
  font-size: 14px;
}

.ui-button--icon-only {
  gap: 0;
  padding: 0;
}

.ui-button--md.ui-button--icon-only {
  width: 32px;
}

.ui-button--sm.ui-button--icon-only {
  width: 26px;
}

.ui-button--lg.ui-button--icon-only {
  width: 38px;
}

.ui-button--ghost {
  background: transparent;
  color: var(--text);
}

.ui-button--secondary {
  background: var(--bg-subtle);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--border-soft);
}

.ui-button--secondary:hover:not(:disabled),
.ui-button--text:hover:not(:disabled) {
  background: var(--bg-hover);
}

.ui-button--text {
  background: transparent;
  color: var(--accent);
}

.ui-button--ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  filter: none;
}

.ui-button--primary {
  background: var(--accent-soft);
  color: var(--accent-on-soft, var(--accent));
  font-weight: 600;
}

.ui-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent-on-soft, var(--accent));
  filter: none;
}

.ui-button--warning {
  background: var(--warn-soft);
  color: var(--warn);
  font-weight: 600;
}

.ui-button--warning:hover:not(:disabled) {
  background: color-mix(in srgb, var(--warn) 20%, transparent);
  color: var(--warn);
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
