<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { SidebarNavItem } from "../../config/appShell";
import SidebarNavRowContent from "./SidebarNavRowContent.vue";
import SidebarRowTools from "./SidebarRowTools.vue";

const props = withDefaults(defineProps<{
  item: SidebarNavItem;
  agentId: string;
  project?: boolean;
}>(), {
  project: false,
});

const rowStyle = computed(() => {
  const toolCount = props.item.tools?.length ?? 0;
  return toolCount > 0 ? { paddingRight: `${10 + toolCount * 24}px` } : undefined;
});

function selectItem() {
  if (props.item.disabled || !props.item.onSelect) return;
  void props.item.onSelect();
}
</script>

<template>
  <div class="sb-tree__entry">
    <RouterLink
      v-if="item.to && !item.disabled"
      :to="item.to"
      class="sb-tree__row"
      :class="[
        { 'is-active': item.active },
        { 'sb-tree__row--project': project },
      ]"
      :style="rowStyle"
      exact-active-class="is-active"
      :data-agent-id="agentId"
    >
      <SidebarNavRowContent :item="item" />
    </RouterLink>
    <button
      v-else
      type="button"
      class="sb-tree__row sb-tree__row--button"
      :class="[
        { 'is-active': item.active },
        { 'sb-tree__row--project': project },
      ]"
      :style="rowStyle"
      :disabled="item.disabled || !item.onSelect"
      :data-agent-id="agentId"
      @click="selectItem"
    >
      <SidebarNavRowContent :item="item" />
    </button>
    <SidebarRowTools
      v-if="item.tools?.length"
      :tools="item.tools"
      :agent-id-base="`${agentId}.tool`"
    />
  </div>
</template>

<style scoped>
.sb-tree__entry {
  position: relative;
  min-width: 0;
}

.sb-tree__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  min-width: 0;
  text-align: left;
}

.sb-tree__row:hover {
  background: var(--bg-hover);
}

.sb-tree__row:disabled {
  color: var(--text-faint);
  cursor: default;
}

.sb-tree__row:disabled:hover {
  background: transparent;
}

.sb-tree__row.is-active {
  background: var(--bg-active);
  color: var(--accent);
}

.sb-tree__row--project {
  color: var(--text-muted);
}

.sb-tree__entry:hover .sb-tree__hover-tools,
.sb-tree__entry:focus-within .sb-tree__hover-tools {
  opacity: 1;
  pointer-events: auto;
}

.sb-tree__hover-tools {
  position: absolute;
  top: 50%;
  right: 6px;
  z-index: 1;
  transform: translateY(-50%);
}
</style>
