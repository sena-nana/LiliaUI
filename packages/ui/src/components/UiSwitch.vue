<script setup lang="ts">
import type { SwitchEmits, SwitchProps } from "@lilia/ui-contract";
export type UiSwitchControlPosition = "start" | "end";

const props = withDefaults(defineProps<SwitchProps & {
  hint?: string;
  controlPosition?: UiSwitchControlPosition;
  block?: boolean;
}>(), {
  modelValue: false,
  label: undefined,
  hint: undefined,
  controlPosition: "start",
  block: false,
  disabled: false,
  loading: false,
  invalid: false,
  agentId: undefined,
  ariaLabel: undefined,
  ariaDescribedby: undefined,
});

const emit = defineEmits<SwitchEmits>();

function onChange(event: Event) {
  if (props.disabled || props.loading) return;
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
  emit("change", event);
}
</script>

<template>
  <label
    class="ui-switch"
    :class="[
      `ui-switch--control-${controlPosition}`,
      {
        'ui-switch--block': block,
      },
    ]"
  >
    <input
      type="checkbox"
      class="ui-switch__input"
      role="switch"
      :checked="modelValue"
      :aria-checked="modelValue"
      :aria-label="ariaLabel ?? label"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="invalid || undefined"
      :aria-busy="loading || undefined"
      :disabled="disabled || loading"
      :data-agent-id="agentId"
      @change="onChange"
    />
    <span class="ui-switch__track" aria-hidden="true"></span>
    <span v-if="label || hint || $slots.default" class="ui-switch__text">
      <span class="ui-switch__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="hint" class="ui-switch__hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.ui-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}

.ui-switch--block {
  width: 100%;
}

.ui-switch--control-end {
  justify-content: space-between;
}

.ui-switch--control-end .ui-switch__track {
  order: 2;
}

.ui-switch--control-end .ui-switch__text {
  order: 1;
}

.ui-switch > .ui-switch__input {
  all: unset;
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  opacity: 0;
  pointer-events: none;
}

.ui-switch__track {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 16px;
  flex: 0 0 30px;
  border: 1px solid color-mix(in srgb, var(--border-strong) 82%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-hover) 78%, var(--bg));
  transition: background-color 0.14s ease, border-color 0.14s ease;
}

.ui-switch__track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 3px;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--text-faint) 70%, var(--bg));
  transition: transform 0.14s ease, background-color 0.14s ease;
}

.ui-switch__input:checked + .ui-switch__track {
  border-color: color-mix(in srgb, var(--accent) 82%, transparent);
  background: var(--accent);
}

.ui-switch__input:checked + .ui-switch__track::after {
  transform: translateX(14px);
  background: var(--accent-text);
}

.ui-switch__input:focus-visible + .ui-switch__track {
  outline: 2px solid color-mix(in srgb, var(--accent) 58%, transparent);
  outline-offset: 2px;
}

.ui-switch:hover .ui-switch__track {
  border-color: color-mix(in srgb, var(--accent) 42%, var(--border-strong));
}

.ui-switch:has(.ui-switch__input:disabled) {
  cursor: not-allowed;
  opacity: 0.55;
}

.ui-switch__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;
}

.ui-switch__label {
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
}

.ui-switch__hint {
  color: var(--text-muted);
  font-size: 12px;
}
</style>
