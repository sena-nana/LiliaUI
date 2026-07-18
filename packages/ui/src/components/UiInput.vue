<script setup lang="ts">
import type { InputEmits, InputProps, UIControlSize } from "@lilia/ui-contract";
export type UiControlSize = UIControlSize;

withDefaults(defineProps<Omit<InputProps, "size"> & {
  size?: UiControlSize;
}>(), {
  modelValue: "",
  type: "text",
  size: "md",
  disabled: false,
  loading: false,
  invalid: false,
  agentId: undefined,
});

const emit = defineEmits<InputEmits>();

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  emit("input", event);
}
</script>

<template>
  <input
    class="ui-input"
    :class="`ui-input--${size}`"
    :type="type"
    :value="modelValue"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="required"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @input="onInput"
  />
</template>

<style scoped>
.ui-input {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  line-height: 1.25;
  transition: border-color 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
}

.ui-input--md {
  height: 30px;
  padding: 0 9px;
}

.ui-input--sm {
  height: 28px;
  padding: 0 8px;
}

.ui-input--lg {
  height: 36px;
  padding: 0 11px;
  font-size: 14px;
}

.ui-input:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-input:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
  outline: none;
}

.ui-input:disabled {
  background: var(--bg-subtle);
  color: var(--text-faint);
  cursor: not-allowed;
  opacity: 0.68;
}

.ui-input::placeholder {
  color: var(--text-faint);
}
</style>
