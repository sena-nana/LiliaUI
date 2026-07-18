<script setup lang="ts">
import { useTooltipPrimitive } from "@lilia/ui-foundation/tooltip";
import { computed, useId, useSlots } from "vue";
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
const slots = useSlots();
const hasContractTrigger = computed(() => Boolean(slots.trigger));
const visible = computed(() => props.open ?? tooltip.visible.value);
</script>

<template>
  <span
    class="nana-tooltip-anchor"
    :aria-describedby="!hasContractTrigger && text && visible ? id : undefined"
    @mouseenter="tooltip.show"
    @mouseleave="tooltip.hide"
    @pointerenter="tooltip.show"
    @pointerleave="tooltip.hide"
    @focusin="tooltip.show"
    @focusout="tooltip.hide"
    @keydown.esc="tooltip.hide"
  >
    <slot v-if="!hasContractTrigger" />
    <slot v-else name="trigger" :described-by="visible ? id : undefined" />
    <span
      v-if="visible && (text || (hasContractTrigger && $slots.default))"
      :id="id"
      role="tooltip"
      class="nana-tooltip"
      :class="`nana-tooltip--${placement}`"
      :data-agent-id="agentId"
    ><slot v-if="hasContractTrigger">{{ text }}</slot><template v-else>{{ text }}</template></span>
  </span>
</template>
