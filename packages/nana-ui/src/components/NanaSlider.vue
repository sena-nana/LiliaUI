<script setup lang="ts">
import type { SliderEmits, SliderProps } from "@lilia/ui-contract";
import { ref, watch } from "vue";

const props = withDefaults(defineProps<SliderProps>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  loading: false,
  invalid: false,
});
const emit = defineEmits<SliderEmits>();
const interacting = ref(false);
const displayValue = ref(props.modelValue);

watch(() => props.modelValue, (value) => {
  if (!interacting.value) displayValue.value = value;
});

function endInteraction() {
  interacting.value = false;
  displayValue.value = props.modelValue;
}

function onInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value);
  displayValue.value = next;
  emit("update:modelValue", next);
  emit("input", event);
}
</script>

<template>
  <input
    type="range"
    class="nana-slider"
    :value="displayValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @pointerdown="interacting = true"
    @pointerup="endInteraction"
    @pointercancel="endInteraction"
    @input="onInput"
    @change="endInteraction(); emit('change', $event)"
  />
</template>
