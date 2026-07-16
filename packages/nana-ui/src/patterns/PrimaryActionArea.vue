<script setup lang="ts">
defineProps<{ agentId?: string }>();
</script>
<template><div class="nana-primary-actions" :data-agent-id="agentId"><div class="nana-primary-actions__main"><slot /></div><div v-if="$slots.secondary" class="nana-primary-actions__secondary"><slot name="secondary" /></div><div v-if="$slots.more"><slot name="more" /></div></div></template>
