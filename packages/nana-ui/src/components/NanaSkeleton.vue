<script setup lang="ts">
import type { SkeletonProps } from "@lilia/ui-contract";
withDefaults(defineProps<SkeletonProps>(), { width: "100%", height: "1em", label: "正在加载" });
</script>
<template><span class="nana-skeleton" role="status" :aria-label="label" :data-agent-id="agentId" :style="{ width, height }" /></template>
