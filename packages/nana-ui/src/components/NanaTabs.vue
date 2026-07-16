<script setup lang="ts" generic="T extends string">
import type { TabsProps } from "@lilia/ui-contract";
const props = withDefaults(defineProps<TabsProps<T>>(), { orientation: "horizontal" });
const emit = defineEmits<{ "update:modelValue": [value: T] }>();
function onKeydown(event: KeyboardEvent, index: number) {
  const keys = props.orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === keys[0] ? -1 : 1;
  let next = index;
  do next = (next + direction + props.options.length) % props.options.length;
  while (props.options[next]?.disabled && next !== index);
  const option = props.options[next];
  if (option && !option.disabled) emit("update:modelValue", option.value);
}
</script>

<template>
  <div class="nana-tabs" :class="`nana-tabs--${orientation}`" role="tablist" :aria-orientation="orientation" :data-agent-id="agentId">
    <button v-for="(option, index) in options" :key="option.value" type="button" role="tab" :aria-selected="option.value === modelValue" :tabindex="option.value === modelValue ? 0 : -1" :disabled="option.disabled" @click="emit('update:modelValue', option.value)" @keydown="onKeydown($event, index)">{{ option.label }}</button>
  </div>
</template>
