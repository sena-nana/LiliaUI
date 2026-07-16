<script setup lang="ts">
import type { SwitchProps } from "@lilia/ui-contract";
withDefaults(defineProps<SwitchProps>(), { modelValue: false, disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: boolean]; change: [value: boolean] }>();
</script>

<template>
  <button
    type="button"
    role="switch"
    class="nana-switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel ?? label"
    :aria-describedby="ariaDescribedby"
    :disabled="disabled"
    :data-agent-id="agentId"
    @click="emit('update:modelValue', !modelValue); emit('change', !modelValue)"
  >
    <span class="nana-switch__track"><span class="nana-switch__thumb" /></span>
    <span v-if="label" class="nana-switch__label">{{ label }}</span>
  </button>
</template>
