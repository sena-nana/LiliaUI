<script setup lang="ts">
import type { ConnectionState } from "@lilia/ui-contract";
import NanaCard from "../components/NanaCard.vue";
import NanaStatusBadge from "../components/NanaStatusBadge.vue";
const props = defineProps<{ title: string; state: ConnectionState; description?: string; agentId?: string }>();
const tone = () => props.state === "connected" ? "success" : props.state === "failed" ? "error" : props.state === "reconnecting" ? "warning" : "neutral";
</script>
<template><NanaCard :agent-id="agentId"><header class="nana-device__header"><h3>{{ title }}</h3><NanaStatusBadge :tone="tone()" :label="state" /></header><p v-if="description">{{ description }}</p><slot /></NanaCard></template>
