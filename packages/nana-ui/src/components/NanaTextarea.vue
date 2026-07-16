<script setup lang="ts">
import type { TextareaProps } from "@lilia/ui-contract";

withDefaults(defineProps<TextareaProps>(), {
  modelValue: "",
  rows: 4,
  resize: "vertical",
  size: "md",
  disabled: false,
  invalid: false,
});
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <textarea
    class="nana-control nana-textarea"
    :class="`nana-control--${size}`"
    :value="modelValue"
    :rows="rows"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="required"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    :style="{ resize }"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
