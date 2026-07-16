<script setup lang="ts">
import type { ListItemProps } from "@lilia/ui-contract";
withDefaults(defineProps<ListItemProps>(), { active: false, disabled: false, selected: false });
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    class="nana-list-item"
    :class="{ 'is-active': active, 'is-selected': selected }"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    :aria-pressed="selected"
    :data-agent-id="agentId"
    @click="emit('select')"
  ><slot /></button>
</template>
