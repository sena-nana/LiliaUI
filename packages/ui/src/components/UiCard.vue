<script setup lang="ts">
import type { CardProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import { computed } from "vue";
import UiSpinner from "./UiSpinner.vue";

export type UiCardVariant = "surface" | "default" | "outlined" | "raised" | "flat" | "interactive";

const props = withDefaults(defineProps<Omit<CardProps, "variant"> & {
  title?: string;
  variant?: UiCardVariant;
  empty?: boolean;
  loading?: boolean;
}>(), {
  title: undefined,
  variant: "surface",
  empty: false,
  loading: false,
  selected: false,
  disabled: false,
  agentId: undefined,
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
    class="card ui-card"
    :class="[`card--${variant === 'default' ? 'surface' : variant}`, { empty, 'is-selected': selected, 'is-disabled': disabled, 'lilia-interactive-item': variant === 'interactive' }]"
    :data-agent-id="agentId"
    :aria-disabled="disabled || undefined"
    :data-lilia-selected="selected ? 'true' : undefined"
  >
    <h2 v-if="title || $slots.title">
      <span class="card-h2__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <UiSpinner v-if="loading" class="card-title-loader" />
    </h2>
    <slot />
  </section>
</template>

<style>
.ui-card.card--interactive { transition: background-color 0.12s ease, border-color 0.12s ease; }
.ui-card[data-lilia-surface-mode="translucent"] { background: transparent; }
.ui-card.card--interactive:hover:not(.is-disabled) { background: var(--lilia-state-layer-hover); }
.ui-card.card--interactive:active:not(.is-disabled) { background: var(--lilia-state-layer-pressed); }
.ui-card.is-selected { border: 1px solid var(--lilia-state-indicator-selected); background: var(--lilia-state-layer-selected); color: var(--lilia-state-foreground-selected); }
.ui-card.is-selected:hover:not(.is-disabled) { background: var(--lilia-state-layer-selected-hover); }
.ui-card.is-selected:active:not(.is-disabled) { background: var(--lilia-state-layer-selected-pressed); }
.ui-card.is-disabled { opacity: 0.55; }
</style>
