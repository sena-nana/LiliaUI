<script setup lang="ts">
import type { TextareaEmits, TextareaProps } from "@lilia/ui-contract";

withDefaults(defineProps<TextareaProps>(), {
  modelValue: "",
  rows: 4,
  resize: "vertical",
  size: "md",
  disabled: false,
  loading: false,
  invalid: false,
  agentId: undefined,
});

const emit = defineEmits<TextareaEmits>();

function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  emit("update:modelValue", value);
  emit("input", event);
}
</script>

<template>
  <textarea
    class="ui-input ui-textarea"
    :class="`ui-input--${size}`"
    :value="modelValue"
    :rows="rows"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="required"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :style="{ resize }"
    :data-agent-id="agentId"
    @input="onInput"
  />
</template>

<style scoped>
.ui-textarea { width: 100%; max-width: 100%; min-width: 0; min-height: 96px; padding: 9px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font: inherit; font-size: 13px; line-height: 1.45; }
.ui-textarea.ui-input--sm { min-height: 80px; padding: 8px; font-size: 12px; }
.ui-textarea.ui-input--lg { min-height: 112px; padding: 11px; font-size: 14px; }
.ui-textarea:hover:not(:disabled) { border-color: var(--border-strong); }
.ui-textarea:focus-visible { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); outline: none; }
.ui-textarea:disabled { background: var(--bg-subtle); color: var(--text-faint); cursor: not-allowed; opacity: 0.68; }
.ui-textarea::placeholder { color: var(--text-faint); }
</style>
