<script setup lang="ts">
import { useTooltipPrimitive } from "@lilia/ui-foundation/tooltip";
import { useId } from "vue";
import type { TooltipProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<TooltipProps>(), {
  text: undefined,
  open: undefined,
  delayMs: 350,
  placement: "top",
  agentId: undefined,
});
const id = `nana-tooltip-${useId()}`;
const tooltip = useTooltipPrimitive(props.delayMs);
</script>

<template>
  <span
    class="nana-tooltip-anchor"
    :aria-describedby="text && (open ?? tooltip.visible.value) ? id : undefined"
    @mouseenter="tooltip.show"
    @mouseleave="tooltip.hide"
    @focusin="tooltip.show"
    @focusout="tooltip.hide"
  >
    <slot />
    <span
      v-if="text && (open ?? tooltip.visible.value)"
      :id="id"
      role="tooltip"
      class="nana-tooltip"
      :class="`nana-tooltip--${placement}`"
      :data-agent-id="agentId"
    >{{ text }}</span>
  </span>
</template>
