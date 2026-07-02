<script setup lang="ts">
withDefaults(defineProps<{
  inertWhenClosed?: boolean;
  open: boolean;
}>(), {
  inertWhenClosed: true,
});
</script>

<template>
  <div
    class="sidebar-collapse"
    :class="{ 'is-open': open }"
    :aria-hidden="open ? undefined : 'true'"
    :inert="!open && inertWhenClosed ? true : undefined"
  >
    <div class="sidebar-collapse__inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sidebar-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.26s cubic-bezier(0.65, 0, 0.35, 1);
}

.sidebar-collapse.is-open {
  grid-template-rows: 1fr;
}

.sidebar-collapse__inner {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.65, 0, 0.35, 1);
}

.sidebar-collapse.is-open .sidebar-collapse__inner {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-collapse,
  .sidebar-collapse__inner {
    transition: none;
  }
}
</style>
