<script setup lang="ts" generic="T extends string | number">
import type { SelectEmits, SelectProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<SelectProps<T>>(), {
  size: "md",
  disabled: false,
  loading: false,
  invalid: false,
  placeholder: undefined,
});
const emit = defineEmits<SelectEmits<T>>();
function onChange(event: Event) {
  const raw = (event.target as HTMLSelectElement).value;
  const match = props.options.find((option) => String(option.value) === raw);
  if (match) emit("update:modelValue", match.value);
  emit("change", event);
}
</script>

<template>
  <select
    class="nana-control nana-select"
    :class="`nana-control--${size}`"
    :value="modelValue"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="option in options" :key="String(option.value)" :value="option.value" :disabled="option.disabled">
      {{ option.label }}
    </option>
  </select>
</template>
