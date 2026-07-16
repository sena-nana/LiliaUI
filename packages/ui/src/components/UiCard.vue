<script setup lang="ts">
import UiSpinner from "./UiSpinner.vue";

export type UiCardVariant = "surface" | "default" | "outlined" | "raised" | "flat" | "interactive";

withDefaults(defineProps<{
  title?: string;
  variant?: UiCardVariant;
  empty?: boolean;
  loading?: boolean;
  selected?: boolean;
  disabled?: boolean;
  agentId?: string;
}>(), {
  title: undefined,
  variant: "surface",
  empty: false,
  loading: false,
  selected: false,
  disabled: false,
  agentId: undefined,
});
</script>

<template>
  <section
    class="card ui-card"
    :class="[`card--${variant === 'default' ? 'surface' : variant}`, { empty, 'is-selected': selected, 'is-disabled': disabled }]"
    :data-agent-id="agentId"
    :aria-disabled="disabled || undefined"
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

<style scoped>
.ui-card.card--interactive { transition: background-color 0.12s ease, border-color 0.12s ease; }
.ui-card.card--interactive:hover:not(.is-disabled) { background: var(--bg-hover); }
.ui-card.is-selected { border: 1px solid color-mix(in oklch, var(--accent) 45%, var(--border)); background: color-mix(in oklch, var(--accent) 6%, var(--bg-elev)); }
.ui-card.is-disabled { opacity: 0.55; }
</style>
