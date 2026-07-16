<script setup lang="ts">
defineProps<{ label?: string; agentId?: string }>();
</script>
<template><div class="nana-persistent-status" role="status" aria-live="polite" :aria-label="label" :data-agent-id="agentId"><slot /></div></template>
