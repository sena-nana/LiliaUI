<script setup lang="ts">
import type { UIStatusTone } from "@lilia/ui-contract";
import NanaStatusBadge from "../components/NanaStatusBadge.vue";
withDefaults(defineProps<{ title: string; description?: string; tone?: UIStatusTone; agentId?: string }>(), { tone: "success" });
</script>
<template><section class="nana-operation-result" role="status" aria-live="polite" :data-agent-id="agentId"><NanaStatusBadge :label="title" :tone="tone" /><p v-if="description">{{ description }}</p><slot /></section></template>
