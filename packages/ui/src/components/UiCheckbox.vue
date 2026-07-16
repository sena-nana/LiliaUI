<script setup lang="ts">
import type { CheckboxProps } from "@lilia/ui-contract";
import { onMounted, ref, watch } from "vue";

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  label: undefined,
  disabled: false,
  loading: false,
  invalid: false,
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [event: Event];
}>();
const input = ref<HTMLInputElement | null>(null);

function syncIndeterminate(value: boolean) {
  if (input.value) input.value.indeterminate = value;
}

function onChange(event: Event) {
  if (props.disabled || props.loading) return;
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
  emit("change", event);
}

onMounted(() => syncIndeterminate(props.indeterminate));
watch(() => props.indeterminate, syncIndeterminate);
</script>

<template>
  <label
    class="ui-checkbox"
    :class="{ 'is-disabled': disabled || loading, 'is-invalid': invalid }"
  >
    <input
      ref="input"
      class="ui-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled || loading"
      :aria-checked="indeterminate ? 'mixed' : modelValue"
      :aria-invalid="invalid || undefined"
      :aria-busy="loading || undefined"
      :data-agent-id="agentId"
      @change="onChange"
    />
    <span class="ui-checkbox__control" aria-hidden="true">
      <span v-if="indeterminate">−</span>
      <span v-else-if="modelValue">✓</span>
    </span>
    <span v-if="label || $slots.default" class="ui-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.ui-checkbox { display: inline-flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
.ui-checkbox__input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.ui-checkbox__control { display: inline-grid; width: 16px; height: 16px; flex: 0 0 16px; place-items: center; border: 1px solid var(--border-strong); border-radius: 4px; background: var(--bg); color: var(--accent-text); font-size: 12px; font-weight: 700; line-height: 1; transition: background-color 0.12s ease, border-color 0.12s ease; }
.ui-checkbox__input:checked + .ui-checkbox__control,
.ui-checkbox__input[aria-checked="mixed"] + .ui-checkbox__control { border-color: var(--accent); background: var(--accent); }
.ui-checkbox__input:focus-visible + .ui-checkbox__control { outline: 2px solid var(--accent-soft); outline-offset: 2px; }
.ui-checkbox:hover:not(.is-disabled) .ui-checkbox__control { border-color: var(--accent); }
.ui-checkbox.is-invalid .ui-checkbox__control { border-color: var(--err); }
.ui-checkbox.is-disabled { cursor: not-allowed; opacity: 0.55; }
.ui-checkbox__label { min-width: 0; overflow-wrap: anywhere; color: var(--text); font-size: 13px; }
</style>
