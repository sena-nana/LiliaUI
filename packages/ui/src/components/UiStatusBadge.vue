<script setup lang="ts">
import type { StatusBadgeProps } from "@lilia/ui-contract";

withDefaults(defineProps<StatusBadgeProps>(), {
  tone: "neutral",
  agentId: undefined,
});
</script>

<template>
  <span class="ui-status-badge" :class="`ui-status-badge--${tone}`" :data-agent-id="agentId">
    <span class="ui-status-badge__dot" aria-hidden="true" />
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.ui-status-badge { display: inline-flex; max-width: 100%; align-items: center; gap: 6px; padding: 2px 7px; border-radius: var(--radius-pill); background: var(--bg-subtle); color: var(--text-muted); font-size: 11px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-status-badge__dot { width: 6px; height: 6px; flex: 0 0 6px; border-radius: var(--radius-pill); background: currentColor; }
.ui-status-badge--info { background: var(--accent-soft); color: var(--accent); }
.ui-status-badge--success { background: var(--ok-soft); color: var(--ok); }
.ui-status-badge--warning { background: var(--warn-soft); color: var(--warn); }
.ui-status-badge--error { background: var(--err-soft); color: var(--err); }
</style>
