<script setup lang="ts">
import TaskPageHeader from "./TaskPageHeader.vue";
defineProps<{ title: string; description?: string; agentId?: string }>();
</script>
<template><section class="nana-pattern nana-settings" :data-agent-id="agentId"><TaskPageHeader :title="title" :description="description" /><nav v-if="$slots.navigation" class="nana-settings__nav"><slot name="navigation" /></nav><main class="nana-settings__content"><slot /></main></section></template>
