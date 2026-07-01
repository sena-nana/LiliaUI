<script setup lang="ts">
export interface UiSegmentedOption {
  value: string | number;
  label: string;
  icon?: unknown;
  disabled?: boolean;
  agentId?: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: readonly UiSegmentedOption[];
  ariaLabel?: string;
  "aria-label"?: string;
  agentId?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [value: string | number];
}>();

function selectOption(option: UiSegmentedOption) {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
}
</script>

<template>
  <div
    class="segmented ui-segmented"
    role="radiogroup"
    :aria-label="props.ariaLabel ?? props['aria-label']"
    :data-agent-id="agentId"
  >
    <button
      v-for="option in props.options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :class="{ 'is-active': modelValue === option.value }"
      :disabled="option.disabled"
      :data-agent-id="option.agentId"
      @click="selectOption(option)"
    >
      <component v-if="option.icon" :is="option.icon" :size="14" aria-hidden="true" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>
