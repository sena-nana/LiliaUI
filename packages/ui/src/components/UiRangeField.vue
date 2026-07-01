<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ariaLabel?: string;
  "aria-label"?: string;
  agentId?: string;
}>(), {
  step: 1,
  unit: "",
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
  input: [event: Event];
}>();

function onInput(event: Event) {
  emit("update:modelValue", Number((event.target as HTMLInputElement).value));
  emit("input", event);
}
</script>

<template>
  <div class="radius-control settings-row__radius-control ui-range-field">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="props.step"
      :value="modelValue"
      :aria-label="props.ariaLabel ?? props['aria-label']"
      :data-agent-id="agentId"
      @input="onInput"
    />
    <output>{{ modelValue }}{{ unit }}</output>
  </div>
</template>
