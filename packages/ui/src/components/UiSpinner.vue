<script setup lang="ts">
import LoaderCircle from "@lucide/vue/dist/esm/icons/loader-circle.mjs";

withDefaults(defineProps<{
  size?: number;
  label?: string;
}>(), {
  size: 14,
  label: "加载中",
});
</script>

<template>
  <LoaderCircle
    class="ui-spinner is-spinning"
    :size="size"
    role="status"
    :aria-label="label"
  />
</template>

<style scoped>
.ui-spinner {
  display: inline-block;
  flex: 0 0 auto;
  color: currentColor;
}
</style>
