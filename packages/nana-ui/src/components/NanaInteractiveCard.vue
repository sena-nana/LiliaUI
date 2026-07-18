<script setup lang="ts">
import type { InteractiveCardEmits, InteractiveCardProps } from "@lilia/ui-contract";
import NanaCard from "./NanaCard.vue";
const props = withDefaults(defineProps<InteractiveCardProps>(), {
  selected: false,
  disabled: false,
  pressed: undefined,
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "raised",
  surfaceBoundary: true,
});
const emit = defineEmits<InteractiveCardEmits>();
function onClick(event: MouseEvent) {
  if (props.disabled) return;
  emit("select");
  emit("press");
  emit("click", event);
}
</script>

<template>
  <NanaCard
    variant="interactive"
    :selected="selected"
    :disabled="disabled"
    :agent-id="agentId"
    :surface-mode="props.surfaceMode"
    :backdrop-effect="props.backdropEffect"
    :surface-level="props.surfaceLevel"
    :surface-boundary="props.surfaceBoundary"
  >
    <button type="button" class="nana-card__action" data-lilia-selected-indicator="start" :disabled="disabled" :aria-pressed="pressed ?? selected" @click="onClick">
      <slot />
    </button>
  </NanaCard>
</template>
