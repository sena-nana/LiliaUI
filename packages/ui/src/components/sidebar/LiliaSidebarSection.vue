<script setup lang="ts">
import ChevronRight from "@lucide/vue/dist/esm/icons/chevron-right.mjs";
import { useId } from "vue";

export interface LiliaSidebarSectionProps {
  title: string;
  count?: number;
  expanded?: boolean;
  collapsible?: boolean;
  emptyText?: string;
  agentId?: string;
}

const props = withDefaults(defineProps<LiliaSidebarSectionProps>(), {
  count: undefined,
  expanded: true,
  collapsible: true,
  emptyText: undefined,
  agentId: undefined,
});

const emit = defineEmits<{
  "update:expanded": [expanded: boolean];
  toggle: [expanded: boolean];
}>();

const contentId = `lilia-sidebar-section-${useId()}`;

function toggle() {
  if (!props.collapsible) return;
  const next = !props.expanded;
  emit("update:expanded", next);
  emit("toggle", next);
}
</script>

<template>
  <section class="lilia-sidebar-section" :data-agent-id="agentId">
    <header class="lilia-sidebar-section__header">
      <button
        type="button"
        class="lilia-sidebar-section__toggle lilia-interactive-item"
        :class="{ 'is-static': !collapsible }"
        :disabled="!collapsible"
        :aria-expanded="collapsible ? expanded : undefined"
        :aria-controls="collapsible ? contentId : undefined"
        @click="toggle"
      >
        <ChevronRight
          v-if="collapsible"
          class="lilia-sidebar-section__chevron"
          :size="12"
          aria-hidden="true"
        />
        <span class="lilia-sidebar-section__title">{{ title }}</span>
        <span v-if="count !== undefined" class="lilia-sidebar-section__count">{{ count }}</span>
      </button>
      <div v-if="$slots.tools" class="lilia-sidebar-section__tools">
        <slot name="tools" />
      </div>
    </header>
    <div v-show="expanded || !collapsible" :id="contentId" class="lilia-sidebar-section__content">
      <slot />
      <p v-if="emptyText && !$slots.default" class="lilia-sidebar-section__empty">{{ emptyText }}</p>
    </div>
  </section>
</template>

<style scoped>
.lilia-sidebar-section {
  min-width: 0;
}

.lilia-sidebar-section__header {
  height: 26px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--text-faint);
}

.lilia-sidebar-section__toggle {
  min-width: 0;
  height: 24px;
  flex: 1 1 auto;
  padding: 0 4px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  text-align: left;
}

.lilia-sidebar-section__toggle:hover:not(:disabled) {
  background: var(--lilia-state-layer-hover);
  color: var(--text-muted);
}

.lilia-sidebar-section__toggle:focus-visible {
  outline: 2px solid var(--lilia-state-focus-ring);
  outline-offset: -2px;
}

.lilia-sidebar-section__toggle.is-static {
  cursor: default;
  opacity: 1;
}

.lilia-sidebar-section__chevron {
  flex: 0 0 auto;
  transition: transform 0.12s ease;
}

.lilia-sidebar-section__toggle[aria-expanded="true"] .lilia-sidebar-section__chevron {
  transform: rotate(90deg);
}

.lilia-sidebar-section__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.lilia-sidebar-section__count {
  color: var(--text-faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.lilia-sidebar-section__tools {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.lilia-sidebar-section__header:hover .lilia-sidebar-section__tools,
.lilia-sidebar-section__header:focus-within .lilia-sidebar-section__tools {
  opacity: 1;
  pointer-events: auto;
}

.lilia-sidebar-section__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.lilia-sidebar-section__empty {
  margin: 6px 8px;
  color: var(--text-faint);
  font-size: 12px;
}
</style>
