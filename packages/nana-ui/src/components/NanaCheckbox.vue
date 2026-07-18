<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { CheckboxEmits, CheckboxProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
  loading: false,
  invalid: false,
});
const emit = defineEmits<CheckboxEmits>();
const input = ref<HTMLInputElement | null>(null);
const sync = () => { if (input.value) input.value.indeterminate = props.indeterminate; };
onMounted(sync);
watch(() => props.indeterminate, sync);
</script>

<template>
  <label class="nana-check" :class="{ 'is-disabled': disabled || loading }" :data-agent-id="agentId">
    <input
      ref="input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled || loading"
      :aria-checked="indeterminate ? 'mixed' : modelValue"
      :aria-busy="loading || undefined"
      :aria-invalid="invalid || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked); emit('change', $event)"
    />
    <span class="nana-check__mark" aria-hidden="true">{{ indeterminate ? "−" : modelValue ? "✓" : "" }}</span>
    <span v-if="label || $slots.default"><slot>{{ label }}</slot></span>
  </label>
</template>
