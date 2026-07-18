<script setup lang="ts">
import type { ListItemEmits, ListItemProps } from "@lilia/ui-contract";
withDefaults(defineProps<ListItemProps>(), { active: false, disabled: false, selected: false });
const emit = defineEmits<ListItemEmits>();
function onClick(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLButtonElement && event.currentTarget.disabled) return;
  emit("select");
  emit("click", event);
}
</script>

<template>
  <button
    type="button"
    class="nana-list-item lilia-interactive-item"
    :class="{ 'is-active': active, 'is-selected': selected }"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    :aria-pressed="selected"
    :data-lilia-selected="active || selected ? 'true' : undefined"
    :data-agent-id="agentId"
    @click="onClick"
  ><slot /></button>
</template>
