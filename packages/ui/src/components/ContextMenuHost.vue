<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

const { state } = useContextMenu();
const overlayPresence = useOverlayPresence();

const rendered = ref(false);
const activeSubmenuIndex = ref<number | null>(null);
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

function onAfterLeave() {
  if (state.open) return;
  overlayPresence.deactivate();
  finalizeClosedContextMenu();
}

watch(
  () => [state.openSeq, state.open] as const,
  ([, open]) => {
    if (!open) {
      rendered.value = false;
      clearSubmenu();
      return;
    }
    overlayPresence.activate();
    rendered.value = true;
    clearSubmenu();
    setAnchorPoint({ x: state.x, y: state.y });
    void updatePosition();
  },
  { immediate: true },
);
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
        data-lilia-surface-mode="solid"
        data-lilia-backdrop="none"
        data-lilia-surface-level="overlay"
        data-lilia-surface-boundary
        role="menu"
        data-agent-id="context-menu"
        :style="menuStyle"
        @mouseleave="clearSubmenu"
      >
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
  padding: 4px;
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: flex;
  flex-direction: column;
  gap: 1px;
  user-select: none;
  contain: layout style;
  transform-origin: var(--sb-menu-origin-x, 0px) var(--sb-menu-origin-y, 0px);
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

.ctx-menu__item--submenu-active:not(:disabled) {
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
  padding: 4px;
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
