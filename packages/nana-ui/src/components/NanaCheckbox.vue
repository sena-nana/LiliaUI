<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { CheckboxProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
  invalid: false,
});
const emit = defineEmits<{ "update:modelValue": [value: boolean]; change: [event: Event] }>();
const input = ref<HTMLInputElement | null>(null);
const sync = () => { if (input.value) input.value.indeterminate = props.indeterminate; };
onMounted(sync);
watch(() => props.indeterminate, sync);
</script>

<template>
  <label class="nana-check" :class="{ 'is-disabled': disabled }" :data-agent-id="agentId">
    <input
      ref="input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked); emit('change', $event)"
    />
    <span class="nana-check__mark" aria-hidden="true">{{ indeterminate ? "−" : modelValue ? "✓" : "" }}</span>
    <span v-if="label || $slots.default"><slot>{{ label }}</slot></span>
  </label>
</template>
