<script setup lang="ts">
import type { SliderProps } from "@lilia/ui-contract";
withDefaults(defineProps<SliderProps>(), { modelValue: 0, min: 0, max: 100, step: 1, disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: number]; input: [event: Event] }>();
</script>

<template>
  <input
    type="range"
    class="nana-slider"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value)); emit('input', $event)"
  />
</template>
