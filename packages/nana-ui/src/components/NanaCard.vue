<script setup lang="ts">
import type { CardProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import { computed } from "vue";
const props = withDefaults(defineProps<CardProps>(), {
  variant: "default",
  selected: false,
  disabled: false,
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "raised",
  surfaceBoundary: true,
});
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
</script>

<template>
  <section
    v-bind="surfaceAttributes"
    class="nana-card"
    :class="[`nana-card--${variant}`, { 'is-selected': selected, 'is-disabled': disabled, 'lilia-interactive-item': variant === 'interactive' }]"
    :aria-disabled="disabled || undefined"
    :data-agent-id="agentId"
    :data-lilia-selected="selected ? 'true' : undefined"
    data-lilia-selected-indicator="start"
  ><slot /></section>
</template>
