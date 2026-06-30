<script setup lang="ts">
import { computed, watch } from "vue";
import {
  SB_MENU_POP_TRANSITION_MS,
  type AnchoredMenuPlacement,
  type AnchoredMenuPosition,
} from "../composables/menuMotion";
import { useAnchoredOverlay } from "../composables/useAnchoredOverlay";

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
</script>

<template>
  <Teleport to="body">
    <Transition name="sb-menu-pop" :duration="SB_MENU_POP_TRANSITION_MS">
      <div
        v-if="open"
        ref="overlayEl"
        class="sb-menu"
        :role="role"
        :aria-label="ariaLabel"
        :style="overlayStyle"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
