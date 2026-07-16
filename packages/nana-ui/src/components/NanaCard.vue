<script setup lang="ts">
import type { CardProps } from "@lilia/ui-contract";
withDefaults(defineProps<CardProps>(), { variant: "default", selected: false, disabled: false });
</script>

<template>
  <section
    class="nana-card"
    :class="[`nana-card--${variant}`, { 'is-selected': selected, 'is-disabled': disabled }]"
    :aria-disabled="disabled || undefined"
    :data-agent-id="agentId"
  ><slot /></section>
</template>
