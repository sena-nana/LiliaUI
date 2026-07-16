<script setup lang="ts">
import type { InteractiveCardProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<InteractiveCardProps & { type?: "button" | "submit" | "reset" }>(), {
  variant: "interactive",
  selected: false,
  pressed: undefined,
  disabled: false,
  type: "button",
  agentId: undefined,
});
const emit = defineEmits<{ press: []; click: [event: MouseEvent] }>();

function onClick(event: MouseEvent) {
  if (props.disabled) return;
  emit("press");
  emit("click", event);
}
</script>

<template>
  <button
    class="ui-interactive-card"
    :class="[`ui-interactive-card--${variant}`, { 'is-selected': selected }]"
    :type="type"
    :disabled="disabled"
    :aria-pressed="pressed ?? selected"
    :aria-current="selected ? 'true' : undefined"
    :data-agent-id="agentId"
    @click="onClick"
  ><slot /></button>
</template>

<style scoped>
.ui-interactive-card { display: block; width: 100%; min-width: 0; padding: 14px 16px; border: 1px solid transparent; border-radius: var(--radius-md); background: var(--bg-elev); color: var(--text); cursor: pointer; font: inherit; text-align: left; overflow-wrap: anywhere; transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease; }
.ui-interactive-card--outlined { border-color: var(--border); }
.ui-interactive-card--raised { box-shadow: var(--shadow-surface); }
.ui-interactive-card:hover:not(:disabled) { border-color: var(--border-strong); background: var(--bg-hover); }
.ui-interactive-card.is-selected { border-color: color-mix(in oklch, var(--accent) 55%, var(--border)); background: var(--accent-soft); }
.ui-interactive-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ui-interactive-card:disabled { cursor: not-allowed; opacity: 0.55; }
</style>
