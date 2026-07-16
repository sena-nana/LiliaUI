<script setup lang="ts">
import type { SidebarNavItem } from "../../config/appShell";

defineProps<{
  item: SidebarNavItem;
}>();
</script>

<template>
  <component :is="item.icon" :size="14" aria-hidden="true" />
  <span class="sb-tree__name">{{ item.label }}</span>
  <span v-if="item.badges?.length" class="sb-tree__badges" aria-hidden="true">
    <span
      v-for="badge in item.badges"
      :key="badge.key"
      class="sb-badge"
      :class="badge.tone ? `sb-badge--${badge.tone}` : undefined"
      :title="badge.title"
    >
      {{ badge.label }}
    </span>
  </span>
</template>

<style scoped>
.sb-tree__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-tree__badges {
  flex: 0 0 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.sb-badge {
  flex: 0 1 auto;
  min-width: 18px;
  max-width: 78px;
  height: 17px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  line-height: 17px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-badge--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.sb-badge--warn {
  background: var(--warn-soft);
  color: var(--warn);
}

.sb-badge--error {
  background: var(--err-soft);
  color: var(--err);
}

.sb-badge--muted {
  background: var(--bg-subtle);
  color: var(--text-faint);
}
</style>
