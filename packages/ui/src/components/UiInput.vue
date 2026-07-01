<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string | number;
  type?: string;
  agentId?: string;
}>(), {
  type: "text",
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [event: Event];
}>();

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  emit("input", event);
}
</script>

<template>
  <input
    class="ui-input"
    :type="type"
    :value="modelValue"
    :data-agent-id="agentId"
    @input="onInput"
  />
</template>
