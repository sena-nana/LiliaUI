<script setup lang="ts">
import { computed } from "vue";
import {
  APP_SHELL_COPY,
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUSES,
  SIDEBAR_GLOBAL_ACTIONS,
  SIDEBAR_GROUPS,
  SIDEBAR_NAV,
  SIDEBAR_TOP_CONTENT,
  type SidebarActionItem,
} from "../config/appShell";
import UiIconButton from "../components/UiIconButton.vue";
import SidebarFooter from "../components/sidebar/SidebarFooter.vue";
import SidebarNavRow from "../components/sidebar/SidebarNavRow.vue";

const hasNavSection = computed(() => SIDEBAR_NAV.length > 0);
const hasTopSection = computed(() => (
  SIDEBAR_TOP_CONTENT.value !== null
  || SIDEBAR_GLOBAL_ACTIONS.length > 0
  || hasNavSection.value
));

function selectAction(action: SidebarActionItem) {
  if (action.disabled || !action.onSelect) return;
  void action.onSelect();
}

</script>

<template>
  <aside class="secondary-panel" data-agent-id="sidebar.main">
    <div v-if="hasTopSection" class="secondary-panel__top">
      <div
        v-if="SIDEBAR_TOP_CONTENT || SIDEBAR_GLOBAL_ACTIONS.length"
        class="sb-section sb-section--actions"
      >
        <component v-if="SIDEBAR_TOP_CONTENT" :is="SIDEBAR_TOP_CONTENT" />
        <template v-else>
          <UiIconButton
            v-for="action in SIDEBAR_GLOBAL_ACTIONS"
            :key="action.key"
            class="sb-action"
            size="md"
            :icon="action.icon"
            :label="action.label"
            :active="action.active"
            :disabled="action.disabled || !action.onSelect"
            :agent-id="`sidebar.global.${action.key}`"
            @click="selectAction(action)"
          />
        </template>
      </div>

      <div v-if="hasNavSection" class="sb-section">
        <div class="sb-section__header">
          <span class="sb-section__title">{{ APP_SHELL_COPY.workspaceSectionTitle }}</span>
        </div>
        <nav class="sb-tree" aria-label="主导航">
          <SidebarNavRow
            v-for="item in SIDEBAR_NAV"
            :key="item.key"
            :item="item"
            :agent-id="`sidebar.nav.${item.key}`"
          />
        </nav>
      </div>
    </div>

    <div class="secondary-panel__body">
      <div
        v-for="group in SIDEBAR_GROUPS"
        :key="group.key"
        class="sb-section"
        :data-agent-id="`sidebar.group.${group.key}`"
      >
        <div class="sb-section__header">
          <span class="sb-section__title">{{ group.title }}</span>
          <div v-if="group.tools?.length" class="sb-section__tools">
            <UiIconButton
              v-for="tool in group.tools"
              :key="tool.key"
              class="sb-icon-btn"
              size="sm"
              :icon="tool.icon"
              :label="tool.label"
              :active="tool.active"
              :disabled="tool.disabled || !tool.onSelect"
              :agent-id="`sidebar.group.${group.key}.tool.${tool.key}`"
              @click="selectAction(tool)"
            />
          </div>
        </div>
        <div class="sb-tree">
          <SidebarNavRow
            v-for="item in group.items"
            :key="item.key"
            :item="item"
            :agent-id="`sidebar.group.${group.key}.item.${item.key}`"
            project
          />
          <p v-if="group.emptyText" class="sb-tree__empty">{{ group.emptyText }}</p>
        </div>
      </div>
    </div>

    <div class="secondary-panel__footer">
      <SidebarFooter
        :links="SIDEBAR_FOOTER_LINKS"
        :statuses="SIDEBAR_FOOTER_STATUSES"
      />
    </div>
  </aside>
</template>

<style scoped>
.sb-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.sb-section--actions {
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 2px 2px 0;
}

.sb-section__header {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 6px 0 8px;
  color: var(--text-faint);
}

.sb-section__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.sb-section__tools {
  margin-left: auto;
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.sb-section__header:hover .sb-section__tools,
.sb-section__header:focus-within .sb-section__tools {
  opacity: 1;
}

.sb-action {
  flex: 1;
  width: auto;
  min-width: 0;
  height: 30px;
  border-radius: var(--radius-sm);
}

.sb-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
}

.sb-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 0;
}

.sb-tree__empty {
  margin: 6px 8px;
  color: var(--text-faint);
  font-size: 12px;
}

</style>
