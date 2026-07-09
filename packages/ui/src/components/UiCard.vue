<script setup lang="ts">
import UiSpinner from "./UiSpinner.vue";

export type UiCardVariant = "surface" | "outlined" | "raised" | "flat";

withDefaults(defineProps<{
  title?: string;
  variant?: UiCardVariant;
  empty?: boolean;
  loading?: boolean;
  agentId?: string;
}>(), {
  title: undefined,
  variant: "surface",
  empty: false,
  loading: false,
  agentId: undefined,
});
</script>

<template>
  <section
    class="card ui-card"
    :class="[`card--${variant}`, { empty }]"
    :data-agent-id="agentId"
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
