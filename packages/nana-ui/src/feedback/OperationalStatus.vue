<script setup lang="ts">
import { computed } from "vue";
import type { OperationalState } from "@lilia/ui-contract";
import NanaStatusBadge from "../components/NanaStatusBadge.vue";
import { summarizeOperationalState } from "../state/operational";
const props = defineProps<{ state: OperationalState; agentId?: string }>();
const summary = computed(() => summarizeOperationalState(props.state));
</script>
<template><span :aria-live="summary.announce" :data-agent-id="agentId"><NanaStatusBadge :label="summary.label" :tone="summary.tone" /></span></template>
