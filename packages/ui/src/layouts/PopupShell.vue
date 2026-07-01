<script setup lang="ts">
import "./popup-shell.css";

withDefaults(defineProps<{
  status?: boolean;
}>(), {
  status: false,
});
</script>

<template>
  <div class="popup-shell" :class="{ 'popup-shell--status': status }">
    <slot name="titlebar" />
    <main class="popup-shell__main">
      <slot />
    </main>
  </div>
</template>
