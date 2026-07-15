<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  APP_SHELL_COPY,
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUS,
  SIDEBAR_GLOBAL_ACTIONS,
  SIDEBAR_GROUPS,
  SIDEBAR_NAV,
  SIDEBAR_TOP_CONTENT,
  type SidebarActionItem,
} from "../config/appShell";
import UiIconButton from "../components/UiIconButton.vue";
import SidebarFooter from "../components/sidebar/SidebarFooter.vue";
import SidebarRowTools from "../components/sidebar/SidebarRowTools.vue";

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

function selectNavItem(item: { disabled?: boolean; onSelect?: () => void | Promise<void> }) {
  if (item.disabled || !item.onSelect) return;
  void item.onSelect();
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
          <template v-for="item in SIDEBAR_NAV" :key="item.label">
            <RouterLink
              v-if="item.to && !item.disabled"
              :to="item.to"
              class="sb-tree__row"
              :class="{ 'is-active': item.active }"
              exact-active-class="is-active"
              :data-agent-id="`sidebar.nav.${item.key}`"
            >
              <component :is="item.icon" :size="14" aria-hidden="true" />
              <span class="sb-tree__name">{{ item.label }}</span>
              <SidebarRowTools
                v-if="item.tools?.length"
                :tools="item.tools"
                :agent-id-base="`sidebar.nav.${item.key}.tool`"
              />
            </RouterLink>
            <button
              v-else
              type="button"
              class="sb-tree__row sb-tree__row--button"
              :class="{ 'is-active': item.active }"
              :disabled="item.disabled || !item.onSelect"
              :data-agent-id="`sidebar.nav.${item.key}`"
              @click="selectNavItem(item)"
            >
              <component :is="item.icon" :size="14" aria-hidden="true" />
              <span class="sb-tree__name">{{ item.label }}</span>
              <SidebarRowTools
                v-if="item.tools?.length"
                :tools="item.tools"
                :agent-id-base="`sidebar.nav.${item.key}.tool`"
              />
            </button>
          </template>
        </nav>
      </div>
    </div>

    <div class="secondary-panel__body">
      <div
        v-for="group in SIDEBAR_GROUPS"
        :key="group.title"
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
          <template v-for="item in group.items" :key="item.label">
            <RouterLink
              v-if="item.to && !item.disabled"
              class="sb-tree__row sb-tree__row--project"
              :class="{ 'is-active': item.active }"
              :to="item.to"
              exact-active-class="is-active"
              :data-agent-id="`sidebar.group.${group.key}.item.${item.key}`"
            >
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
              <SidebarRowTools
                v-if="item.tools?.length"
                :tools="item.tools"
                :agent-id-base="`sidebar.group.${group.key}.item.${item.key}.tool`"
              />
            </RouterLink>
            <button
              v-else
              type="button"
              class="sb-tree__row sb-tree__row--project sb-tree__row--button"
              :class="{ 'is-active': item.active }"
              :disabled="item.disabled || !item.onSelect"
              :data-agent-id="`sidebar.group.${group.key}.item.${item.key}`"
              @click="selectNavItem(item)"
            >
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
              <SidebarRowTools
                v-if="item.tools?.length"
                :tools="item.tools"
                :agent-id-base="`sidebar.group.${group.key}.item.${item.key}.tool`"
              />
            </button>
          </template>
          <p v-if="group.emptyText" class="sb-tree__empty">{{ group.emptyText }}</p>
        </div>
      </div>
    </div>

    <div class="secondary-panel__footer">
      <SidebarFooter
        :links="SIDEBAR_FOOTER_LINKS"
        :status="SIDEBAR_FOOTER_STATUS"
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

.sb-tree__row:hover .sb-tree__hover-tools,
.sb-tree__row:focus-within .sb-tree__hover-tools {
  opacity: 1;
  pointer-events: auto;
}

.sb-tree__row--project {
  color: var(--text-muted);
}

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
