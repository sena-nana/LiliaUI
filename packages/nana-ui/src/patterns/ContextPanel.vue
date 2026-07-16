<script setup lang="ts">
defineProps<{ title?: string; agentId?: string }>();
</script>
<template><section class="nana-context-panel" :data-agent-id="agentId"><h2 v-if="title">{{ title }}</h2><slot /></section></template>
