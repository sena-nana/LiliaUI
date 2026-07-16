<script setup lang="ts">
import type { Component } from "vue";

withDefaults(defineProps<{
  components?: readonly Component[];
}>(), {
  components: () => [],
});
</script>

<template>
  <slot />
  <component
    :is="component"
    v-for="(component, index) in components"
    :key="index"
  />
</template>
