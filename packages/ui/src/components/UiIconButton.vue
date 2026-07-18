<script setup lang="ts">
import type { IconButtonProps } from "@lilia/ui-contract";
import type { Component } from "vue";
import UiButton from "./UiButton.vue";
import type { UiButtonSize, UiButtonVariant } from "./UiButton.vue";
import UiSpinner from "./UiSpinner.vue";

const props = withDefaults(defineProps<Omit<IconButtonProps, "size" | "variant"> & {
  icon: Component;
  title?: string;
  size?: UiButtonSize;
  variant?: UiButtonVariant;
  busy?: boolean;
}>(), {
  title: undefined,
  size: "md",
  variant: "ghost",
  active: false,
  disabled: false,
  loading: false,
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
      { 'is-active': active },
    ]"
    :variant="variant"
    :size="size"
    :aria-label="label"
    :title="title ?? tooltip ?? label"
    :disabled="disabled"
    :loading="loading || busy"
    :invalid="invalid"
    :aria-describedby="ariaDescribedby"
    :agent-id="agentId"
    :aria-pressed="active"
    :data-lilia-selected="active ? 'true' : undefined"
    data-lilia-interactive
    @click="emit('click', $event)"
  >
    <template #icon>
      <UiSpinner v-if="loading || busy" :size="size === 'sm' ? 13 : size === 'lg' ? 16 : 14" :label="label" />
      <component v-else :is="icon" :size="size === 'sm' ? 13 : size === 'lg' ? 16 : 14" aria-hidden="true" />
    </template>
  </UiButton>
</template>

<style>
.ui-icon-button.ui-button {
  flex: 0 0 auto;
  color: var(--text-muted);
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

.ui-icon-button--lg.ui-button {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
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
