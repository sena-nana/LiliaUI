<script setup lang="ts">
import type { InputProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<InputProps & { type?: string }>(), {
  modelValue: "",
  type: "text",
  size: "md",
  disabled: false,
  invalid: false,
});
const emit = defineEmits<{ "update:modelValue": [value: string]; input: [event: Event] }>();
function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
  emit("input", event);
}
</script>

<template>
  <input
    class="nana-control"
    :class="`nana-control--${size}`"
    :type="type"
    :value="modelValue"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="required"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    @input="onInput"
  />
</template>
