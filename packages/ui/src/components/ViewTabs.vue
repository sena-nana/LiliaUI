<script setup lang="ts">
import CheckSquare from "@lucide/vue/dist/esm/icons/square-check.mjs";
import LayoutDashboard from "@lucide/vue/dist/esm/icons/layout-dashboard.mjs";
import MessagesSquare from "@lucide/vue/dist/esm/icons/messages-square.mjs";

export type ViewKey = "overview" | "board" | "todo";

interface Props {
  active: ViewKey;
}

defineProps<Props>();

const tabs: Array<{ key: ViewKey; label: string; icon: unknown; disabled: boolean }> = [
  { key: "overview", label: "概览", icon: MessagesSquare, disabled: false },
  { key: "board", label: "看板", icon: LayoutDashboard, disabled: true },
  { key: "todo", label: "Todo", icon: CheckSquare, disabled: true },
];
</script>

<template>
  <div class="view-tabs" role="tablist" aria-label="视图">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="view-tabs__tab lilia-interactive-item"
      :class="{ 'is-active': active === tab.key }"
      :disabled="tab.disabled"
      :aria-selected="active === tab.key"
      :data-lilia-selected="active === tab.key ? 'true' : undefined"
      :title="tab.disabled ? '即将上线' : tab.label"
      role="tab"
      :data-agent-id="`view-tabs.${tab.key}`"
    >
      <component :is="tab.icon" :size="14" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.view-tabs {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin: -8px -4px 16px;
  padding: 0 4px;
  border-bottom: 1px solid var(--border);
}

.view-tabs__tab {
  position: relative;
  height: 34px;
  padding: 0 12px;
  margin-bottom: -1px;
  border: 0;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.view-tabs__tab:hover:not(:disabled):not(.is-active) {
  background: var(--lilia-state-layer-hover);
  color: var(--text);
  filter: none;
}

.view-tabs__tab.is-active {
  color: var(--lilia-state-foreground-selected);
  background: var(--lilia-state-layer-selected);
}

.view-tabs__tab.is-active:hover:not(:disabled) {
  background: var(--lilia-state-layer-selected-hover);
}

.view-tabs__tab:active:not(:disabled) {
  background: var(--lilia-state-layer-pressed);
}

.view-tabs__tab.is-active:active:not(:disabled) {
  background: var(--lilia-state-layer-selected-pressed);
}

.view-tabs__tab:focus-visible {
  outline: 2px solid var(--lilia-state-focus-ring);
  outline-offset: -2px;
}

.view-tabs__tab:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
