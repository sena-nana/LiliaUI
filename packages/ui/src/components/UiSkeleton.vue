<script setup lang="ts">
import type { SkeletonProps } from "@lilia/ui-contract";
import { computed } from "vue";

const props = withDefaults(defineProps<SkeletonProps>(), {
  width: "100%",
  height: "1em",
  label: undefined,
  agentId: undefined,
});
const style = computed(() => ({ width: props.width, height: props.height }));
</script>

<template>
  <span
    class="ui-skeleton"
    :style="style"
    :role="label ? 'status' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    :data-agent-id="agentId"
  />
</template>

<style scoped>
.ui-skeleton { display: inline-block; max-width: 100%; border-radius: var(--radius-sm); background: var(--bg-hover); animation: ui-skeleton-pulse 1.4s ease-in-out infinite; }
@keyframes ui-skeleton-pulse { 50% { opacity: 0.48; } }
@media (prefers-reduced-motion: reduce) { .ui-skeleton { animation: none; } }
</style>
