<script setup lang="ts">
defineProps<{ title: string; description?: string; agentId?: string }>();
</script>
<template><header class="nana-page-header" :data-agent-id="agentId"><div><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div><div v-if="$slots.status" class="nana-page-header__status"><slot name="status" /></div><div v-if="$slots.actions" class="nana-page-header__actions"><slot name="actions" /></div></header></template>
