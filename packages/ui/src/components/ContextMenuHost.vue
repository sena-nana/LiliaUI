<script setup lang="ts">
/**
 * 全局右键上下文菜单宿主：监听 `openContextMenuAt` 调度并渲染锚定菜单与子菜单。
 * 可搜索菜单在查询非空时扁平展示叶子项；空查询时保留分类二级菜单。
 * 需要显式坐标触发的 action 列表改用 `AnchoredActionMenu`；基于值的选择改用 `Dropdown`。
 */
import { computed, nextTick, ref, watch } from "vue";
import {
  finalizeClosedContextMenu,
  isContextMenuItemPending,
  selectContextMenuItem,
  useContextMenu,
  type ContextMenuItem,
} from "../composables/useContextMenu";
import {
  SB_LAYER_Z_INDEX,
  SB_MENU_POP_TRANSITION_MS,
} from "../composables/menuMotion";
import { useAnchoredOverlay } from "../composables/useAnchoredOverlay";
import { useOverlayPresence } from "../composables/useOverlayActivity";
import "./action-menu.css";

interface LeafMatch {
  item: ContextMenuItem;
  groupLabel?: string;
}

const { state } = useContextMenu();
const overlayPresence = useOverlayPresence();

const rendered = ref(false);
const activeSubmenuIndex = ref<number | null>(null);
const activeSearchIndex = ref(0);
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);
const openState = computed(() => rendered.value && state.open);
const preferredPlacement = computed(() => "bottom-start" as const);
const {
  overlayEl: menuEl,
  overlayStyle,
  setAnchorPoint,
  updatePosition,
} = useAnchoredOverlay({
  open: openState,
  preferredPlacement,
  offset: 0,
});
void menuEl;
const menuStyle = computed(() => ({
  ...overlayStyle.value,
  zIndex: String(SB_LAYER_Z_INDEX.contextMenu),
}));

const isSearching = computed(() =>
  state.searchable && searchQuery.value.trim().length > 0,
);

const searchMatches = computed((): LeafMatch[] => {
  if (!isSearching.value) return [];
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return collectLeaves(state.items).filter(({ item, groupLabel }) =>
    [item.label, item.id, groupLabel, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query),
  );
});

function collectLeaves(items: ContextMenuItem[], groupLabel?: string): LeafMatch[] {
  const leaves: LeafMatch[] = [];
  for (const item of items) {
    if (item.children?.length) {
      leaves.push(...collectLeaves(item.children, item.label));
      continue;
    }
    leaves.push({ item, groupLabel });
  }
  return leaves;
}

function displayLabel(item: ContextMenuItem) {
  return isContextMenuItemPending(item) ? item.confirmLabel : item.label;
}

function isDanger(item: ContextMenuItem) {
  return item.danger || isContextMenuItemPending(item);
}

function hasChildren(item: ContextMenuItem) {
  return Boolean(item.children?.length);
}

function activateSubmenu(item: ContextMenuItem, index: number) {
  activeSubmenuIndex.value = hasChildren(item) && !item.disabled ? index : null;
}

function clearSubmenu() {
  activeSubmenuIndex.value = null;
}

function isSubmenuActive(index: number) {
  return activeSubmenuIndex.value === index;
}

function selectMenuItem(item: ContextMenuItem) {
  if (hasChildren(item)) return;
  void selectContextMenuItem(item);
}

function onSearchInput(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value;
  activeSearchIndex.value = 0;
  clearSubmenu();
}

function onSearchKeydown(event: KeyboardEvent) {
  if (!isSearching.value) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
    }
    return;
  }

  const matches = searchMatches.value;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const count = matches.length;
    if (!count) return;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeSearchIndex.value = (activeSearchIndex.value + direction + count) % count;
  } else if (event.key === "Enter") {
    event.preventDefault();
    const match = matches[activeSearchIndex.value];
    if (match) selectMenuItem(match.item);
  }
}

function onAfterLeave() {
  if (state.open) return;
  overlayPresence.deactivate();
  finalizeClosedContextMenu();
}

watch(
  () => [state.openSeq, state.open] as const,
  async ([, open]) => {
    if (!open) {
      rendered.value = false;
      clearSubmenu();
      searchQuery.value = "";
      activeSearchIndex.value = 0;
      return;
    }
    overlayPresence.activate();
    rendered.value = true;
    clearSubmenu();
    searchQuery.value = "";
    activeSearchIndex.value = 0;
    setAnchorPoint({ x: state.x, y: state.y });
    void updatePosition();
    if (state.searchable) {
      await nextTick();
      searchInput.value?.focus();
      searchInput.value?.select();
    }
  },
  { immediate: true },
);

watch(searchMatches, (matches) => {
  if (activeSearchIndex.value >= matches.length) {
    activeSearchIndex.value = Math.max(0, matches.length - 1);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      name="sb-menu-pop"
      :duration="SB_MENU_POP_TRANSITION_MS"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="rendered"
        ref="menuEl"
        class="ctx-menu"
        :class="{ 'ctx-menu--searchable': state.searchable }"
        data-lilia-surface-mode="solid"
        data-lilia-backdrop="none"
        data-lilia-surface-level="overlay"
        data-lilia-surface-boundary
        role="menu"
        data-agent-id="context-menu"
        :style="menuStyle"
        @mouseleave="clearSubmenu"
      >
        <label v-if="state.searchable" class="ctx-menu__search">
          <input
            ref="searchInput"
            type="search"
            :value="searchQuery"
            :placeholder="state.searchPlaceholder"
            data-agent-id="context-menu.search"
            spellcheck="false"
            @input="onSearchInput"
            @keydown="onSearchKeydown"
            @click.stop
          >
        </label>

        <template v-if="isSearching">
          <button
            v-for="(match, index) in searchMatches"
            :key="match.item.id ?? `${match.groupLabel ?? ''}:${match.item.label}:${index}`"
            type="button"
            class="ctx-menu__item lilia-interactive-item"
            :class="{
              'ctx-menu__item--danger': isDanger(match.item),
              'ctx-menu__item--pending': isContextMenuItemPending(match.item),
              'ctx-menu__item--active': index === activeSearchIndex,
            }"
            :disabled="match.item.disabled"
            role="menuitem"
            :data-agent-id="`context-menu.item.${match.item.id ?? index}`"
            @pointerenter="activeSearchIndex = index"
            @click="selectMenuItem(match.item)"
          >
            <component v-if="match.item.icon" :is="match.item.icon" :size="13" aria-hidden="true" />
            <span class="ctx-menu__label">{{ displayLabel(match.item) }}</span>
            <small v-if="match.groupLabel" class="ctx-menu__meta" aria-hidden="true">{{ match.groupLabel }}</small>
          </button>
          <p v-if="searchMatches.length === 0" class="ctx-menu__empty">{{ state.emptyText }}</p>
        </template>

        <template v-else>
          <div
            v-for="(item, index) in state.items"
            :key="item.id ?? index"
            class="ctx-menu__entry"
          >
            <button
              type="button"
              class="ctx-menu__item lilia-interactive-item"
              :class="{
                'ctx-menu__item--danger': isDanger(item),
                'ctx-menu__item--pending': isContextMenuItemPending(item),
                'ctx-menu__item--has-children': hasChildren(item),
                'ctx-menu__item--submenu-active': isSubmenuActive(index),
              }"
              :disabled="item.disabled"
              role="menuitem"
              :aria-haspopup="hasChildren(item) ? 'menu' : undefined"
              :aria-expanded="hasChildren(item) ? isSubmenuActive(index) : undefined"
              :data-agent-id="`context-menu.item.${item.id ?? index}`"
              @mouseenter="activateSubmenu(item, index)"
              @focus="activateSubmenu(item, index)"
              @click="selectMenuItem(item)"
            >
              <component v-if="item.icon" :is="item.icon" :size="13" aria-hidden="true" />
              <span class="ctx-menu__label">{{ displayLabel(item) }}</span>
              <span v-if="hasChildren(item)" class="ctx-menu__arrow" aria-hidden="true">&gt;</span>
            </button>
            <div
              v-if="hasChildren(item) && isSubmenuActive(index)"
              class="ctx-menu__submenu"
              data-lilia-surface-mode="solid"
              data-lilia-backdrop="none"
              data-lilia-surface-level="overlay"
              data-lilia-surface-boundary
              role="menu"
              :data-agent-id="`context-menu.submenu.${item.id ?? index}`"
            >
              <button
                v-for="(child, childIndex) in item.children"
                :key="child.id ?? childIndex"
                type="button"
                class="ctx-menu__item lilia-interactive-item"
                :class="{
                  'ctx-menu__item--danger': isDanger(child),
                  'ctx-menu__item--pending': isContextMenuItemPending(child),
                }"
                :disabled="child.disabled"
                role="menuitem"
                :data-agent-id="`context-menu.item.${child.id ?? childIndex}`"
                @click="selectMenuItem(child)"
              >
                <component v-if="child.icon" :is="child.icon" :size="13" aria-hidden="true" />
                <span class="ctx-menu__label">{{ displayLabel(child) }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.ctx-menu {
  position: fixed;
  left: 0;
  top: 0;
  min-width: 180px;
  max-width: min(320px, calc(100vw - 8px));
  max-height: min(420px, calc(100vh - 8px));
  padding: 4px;
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: auto;
  user-select: none;
  contain: layout style;
  transform-origin: var(--sb-menu-origin-x, 0px) var(--sb-menu-origin-y, 0px);
}

.ctx-menu--searchable {
  min-width: 220px;
}

.ctx-menu__search {
  display: flex;
  align-items: center;
  min-height: 30px;
  margin-bottom: 2px;
  padding: 0 8px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
}

.ctx-menu__search input {
  width: 100%;
  min-width: 0;
  height: 28px;
  padding: 0;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
  font-size: 12px;
}

.ctx-menu__search input::placeholder {
  color: var(--text-faint);
}

.ctx-menu__entry {
  position: relative;
  display: flex;
}

.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 28px;
  min-width: 0;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.ctx-menu__item--submenu-active:not(:disabled),
.ctx-menu__item--active:not(:disabled) {
  background: var(--lilia-state-layer-hover);
}

.ctx-menu__item:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.ctx-menu__item:disabled:hover {
  background: transparent;
}

.ctx-menu__item--danger {
  color: var(--err);
}

.ctx-menu__item--danger:hover:not(:disabled) {
  background: var(--err-soft);
}

.ctx-menu__item--pending {
  background: var(--err-soft);
  font-weight: 600;
}

.ctx-menu__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ctx-menu__meta,
.ctx-menu__empty {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 400;
}

.ctx-menu__empty {
  margin: 0;
  padding: 10px 8px;
  text-align: center;
}

.ctx-menu__arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 12px;
}

.ctx-menu__submenu {
  position: absolute;
  left: calc(100% + 5px);
  top: -4px;
  z-index: 1;
  min-width: 180px;
  max-width: min(320px, calc(100vw - 8px));
  max-height: min(360px, calc(100vh - 8px));
  padding: 4px;
  overflow: auto;
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
</style>
