<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; state?: "pending" | "current" | "complete" | "failed"; step?: number; agentId?: string }>(), { state: "pending" });
</script>
<template><li class="nana-setup-step" :class="`is-${state}`" :aria-current="state === 'current' ? 'step' : undefined" :data-agent-id="agentId"><span class="nana-setup-step__marker" aria-hidden="true">{{ state === 'complete' ? '✓' : step }}</span><div><h3>{{ title }}</h3><p v-if="description">{{ description }}</p><slot /></div></li></template>
