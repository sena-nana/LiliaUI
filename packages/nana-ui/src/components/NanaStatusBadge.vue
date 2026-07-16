<script setup lang="ts">
import type { StatusBadgeProps } from "@lilia/ui-contract";
withDefaults(defineProps<StatusBadgeProps>(), { tone: "neutral" });
</script>
<template><span class="nana-status" :class="`nana-status--${tone}`" :data-agent-id="agentId"><span aria-hidden="true" />{{ label }}</span></template>
