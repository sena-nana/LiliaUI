<script setup lang="ts">
defineProps<{ label?: string; agentId?: string }>();
</script>
<template><ol class="nana-stepper" :aria-label="label ?? '设置步骤'" :data-agent-id="agentId"><slot /></ol></template>
