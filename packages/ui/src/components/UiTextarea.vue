<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string;
  agentId?: string;
}>(), {
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [event: Event];
}>();

function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  emit("update:modelValue", value);
  emit("input", event);
}
</script>

<template>
  <textarea
    class="ui-input ui-textarea"
    :value="modelValue"
    :data-agent-id="agentId"
    @input="onInput"
  />
</template>
