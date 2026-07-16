<script setup lang="ts">
import NanaInteractiveCard from "../components/NanaInteractiveCard.vue";
defineProps<{ title: string; description?: string; agentId?: string }>();
const emit = defineEmits<{ select: [] }>();
</script>
<template><NanaInteractiveCard class="nana-feature" :agent-id="agentId" @select="emit('select')"><div class="nana-feature__icon"><slot name="icon" /></div><h3>{{ title }}</h3><p v-if="description">{{ description }}</p><slot /></NanaInteractiveCard></template>
