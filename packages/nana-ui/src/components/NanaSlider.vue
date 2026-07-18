<script setup lang="ts">
import type { SliderEmits, SliderProps } from "@lilia/ui-contract";
withDefaults(defineProps<SliderProps>(), { modelValue: 0, min: 0, max: 100, step: 1, disabled: false, loading: false, invalid: false });
const emit = defineEmits<SliderEmits>();
</script>

<template>
  <input
    type="range"
    class="nana-slider"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value)); emit('input', $event)"
    @change="emit('change', $event)"
  />
</template>
