<script setup lang="ts">
import type { TooltipProps } from "@lilia/ui-contract";
import { useTooltipPrimitive } from "@lilia/ui-foundation/tooltip";
import { computed, useId, useSlots } from "vue";

const props = withDefaults(defineProps<TooltipProps & {
  open?: boolean;
  id?: string;
  text?: string;
}>(), {
  open: undefined,
  id: undefined,
  text: undefined,
  agentId: undefined,
  delayMs: 350,
  placement: "top",
});

const slots = useSlots();
const tooltip = useTooltipPrimitive(props.delayMs);
const hasTrigger = computed(() => Boolean(slots.trigger));
const visible = computed(() => props.open ?? (hasTrigger.value ? tooltip.visible.value : true));
const generatedId = `ui-tooltip-${useId()}`;
const tooltipId = computed(() => props.id ?? generatedId);
</script>

<template>
  <span
    v-if="hasTrigger"
    class="lilia-tooltip-anchor"
    @pointerenter="tooltip.show"
    @pointerleave="tooltip.hide"
    @focusin="tooltip.show"
    @focusout="tooltip.hide"
    @keydown.esc="tooltip.hide"
  >
    <slot name="trigger" :described-by="visible ? tooltipId : undefined" />
    <span
      v-if="visible"
      :id="tooltipId"
      class="lilia-tooltip"
      :class="`lilia-tooltip--${placement}`"
      role="tooltip"
      :data-agent-id="agentId"
    ><slot>{{ text }}</slot></span>
  </span>
  <div
    v-else-if="visible"
    :id="tooltipId"
    class="lilia-tooltip"
    :class="`lilia-tooltip--${placement}`"
    role="tooltip"
    :data-agent-id="agentId"
  >
    <slot>{{ text }}</slot>
  </div>
</template>

<style scoped>
.lilia-tooltip-anchor { position: relative; display: inline-flex; min-width: 0; }
.lilia-tooltip {
  position: absolute;
  box-sizing: border-box;
  max-width: calc(100% - 8px);
  padding: 4px 7px;
  overflow: hidden;
  color: var(--text);
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  z-index: var(--z-dialog);
}
.lilia-tooltip-anchor > .lilia-tooltip { max-width: min(280px, 80vw); }
.lilia-tooltip-anchor > .lilia-tooltip--top { bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.lilia-tooltip-anchor > .lilia-tooltip--bottom { top: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.lilia-tooltip-anchor > .lilia-tooltip--left { top: 50%; right: calc(100% + 6px); transform: translateY(-50%); }
.lilia-tooltip-anchor > .lilia-tooltip--right { top: 50%; left: calc(100% + 6px); transform: translateY(-50%); }
</style>
