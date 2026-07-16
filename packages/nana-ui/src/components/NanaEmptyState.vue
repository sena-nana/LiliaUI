<script setup lang="ts">
import type { EmptyStateProps } from "@lilia/ui-contract";
defineProps<EmptyStateProps>();
</script>
<template><section class="nana-empty" :data-agent-id="agentId"><div v-if="$slots.icon" class="nana-empty__icon"><slot name="icon" /></div><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><div v-if="$slots.actions" class="nana-empty__actions"><slot name="actions" /></div></section></template>
