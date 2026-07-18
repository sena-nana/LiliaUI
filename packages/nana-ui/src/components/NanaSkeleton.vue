<script setup lang="ts">
import type { SkeletonProps } from "@lilia/ui-contract";
withDefaults(defineProps<SkeletonProps>(), { width: "100%", height: "1em", label: undefined });
</script>
<template><span class="nana-skeleton" :role="label ? 'status' : undefined" :aria-label="label" :aria-hidden="label ? undefined : 'true'" :data-agent-id="agentId" :style="{ width, height }" /></template>
