<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceRegion } from "@lilia/ui/layouts";

const geometry = useWorkspaceRegion("example-primary");
const width = computed(() => Math.max(1, Math.round(geometry.safeRect.value?.width ?? 1)));
const height = computed(() => Math.max(1, Math.round(geometry.safeRect.value?.height ?? 1)));
</script>

<template>
  <canvas
    class="native-viewport"
    :width="width"
    :height="height"
    :aria-busy="geometry.stable.value ? undefined : 'true'"
    aria-label="Live2D 预览"
  />
</template>
