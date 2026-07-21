<script setup lang="ts">
/**
 * 坐标锚定的通用 action 菜单容器，用于工具栏溢出、显式坐标触发等场景。
 * 右键上下文菜单改用 `ContextMenuHost`；基于值的单/多选改用 `Dropdown` 或 `UiSelect`。
 */
import { computed, watch } from "vue";
import {
  SB_MENU_POP_TRANSITION_MS,
  type AnchoredMenuPlacement,
  type AnchoredMenuPosition,
} from "../composables/menuMotion";
import { useAnchoredOverlay } from "../composables/useAnchoredOverlay";
import { useOverlayPresence } from "../composables/useOverlayActivity";
import "./action-menu.css";

const props = withDefaults(defineProps<{
  open: boolean;
  position: AnchoredMenuPosition;
  preferredPlacement?: AnchoredMenuPlacement;
  offset?: number;
  role?: string;
  ariaLabel?: string;
}>(), {
  preferredPlacement: "bottom-start",
  offset: 0,
  role: "menu",
  ariaLabel: undefined,
});

const openState = computed(() => props.open);
const overlayPresence = useOverlayPresence();
const preferredPlacement = computed(() => props.preferredPlacement);
const {
  overlayEl,
  overlayStyle,
  setAnchorPoint,
  updatePosition,
} = useAnchoredOverlay({
  open: openState,
  preferredPlacement,
  offset: props.offset,
});
void overlayEl;

watch(
  () => [
    props.open,
    props.position.x,
    props.position.y,
    props.position.anchorX,
    props.position.anchorY,
  ] as const,
  ([open]) => {
    if (!open) return;
    setAnchorPoint({
      x: props.position.anchorX,
      y: props.position.anchorY,
    });
    void updatePosition();
  },
  { immediate: true },
);

watch(() => props.open, (open) => {
  if (open) overlayPresence.activate();
}, { immediate: true });

function onAfterLeave() {
  if (!props.open) overlayPresence.deactivate();
}
</script>

<template>
  <Teleport to="body">
    <Transition
      name="sb-menu-pop"
      :duration="SB_MENU_POP_TRANSITION_MS"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="open"
        ref="overlayEl"
        class="sb-menu"
        data-lilia-surface-mode="solid"
        data-lilia-backdrop="none"
        data-lilia-surface-level="overlay"
        data-lilia-surface-boundary
        :role="role"
        :aria-label="ariaLabel"
        :style="overlayStyle"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
