<script setup lang="ts">
import type { TextareaEmits, TextareaProps } from "@lilia/ui-contract";

withDefaults(defineProps<TextareaProps>(), {
  modelValue: "",
  rows: 4,
  resize: "vertical",
  size: "md",
  disabled: false,
  loading: false,
  invalid: false,
});
const emit = defineEmits<TextareaEmits>();
function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
  emit("input", event);
}
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
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :data-agent-id="agentId"
    :style="{ resize }"
    @input="onInput"
  />
</template>
