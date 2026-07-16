<script setup lang="ts">
import type { SidebarNavItem } from "../../config/appShell";
import LiliaSidebarRow from "./LiliaSidebarRow.vue";
import SidebarRowTools from "./SidebarRowTools.vue";

const props = withDefaults(defineProps<{
  item: SidebarNavItem;
  agentId: string;
  emphasis?: "default" | "muted";
}>(), {
  emphasis: "default",
});

function selectItem() {
  if (props.item.disabled || !props.item.onSelect) return;
  void props.item.onSelect();
}
</script>

<template>
  <LiliaSidebarRow
    :label="item.label"
    :icon="item.icon"
    :to="item.to"
    :active="item.active"
    :disabled="item.disabled || (!item.to && !item.onSelect)"
    :agent-id="agentId"
    :class="{ 'sidebar-nav-row--muted': emphasis === 'muted' }"
    @select="selectItem"
  >
    <template v-if="item.badges?.length" #trailing>
      <span class="sb-tree__badges" aria-hidden="true">
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
    <template v-if="item.tools?.length" #tools>
      <SidebarRowTools
        :tools="item.tools"
        :agent-id-base="`${agentId}.tool`"
      />
    </template>
  </LiliaSidebarRow>
</template>

<style scoped>
.sidebar-nav-row--muted :deep(.lilia-sidebar-row__control) {
  color: var(--text-muted);
}

.sb-tree__badges {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.sb-badge {
  min-width: 18px;
  max-width: 78px;
  height: 17px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
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
