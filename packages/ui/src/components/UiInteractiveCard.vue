<script setup lang="ts">
import type { InteractiveCardEmits, InteractiveCardProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import { computed } from "vue";

const props = withDefaults(defineProps<InteractiveCardProps & { type?: "button" | "submit" | "reset" }>(), {
  variant: "interactive",
  selected: false,
  pressed: undefined,
  disabled: false,
  type: "button",
  agentId: undefined,
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "raised",
  surfaceBoundary: true,
});
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
const emit = defineEmits<InteractiveCardEmits>();

function onClick(event: MouseEvent) {
  if (props.disabled) return;
  emit("select");
  emit("press");
  emit("click", event);
}
</script>

<template>
  <button
    v-bind="surfaceAttributes"
    class="ui-interactive-card lilia-interactive-item"
    :class="[`ui-interactive-card--${variant}`, { 'is-selected': selected }]"
    :type="type"
    :disabled="disabled"
    :aria-pressed="pressed ?? selected"
    :aria-current="selected ? 'true' : undefined"
    :data-lilia-selected="selected ? 'true' : undefined"
    :data-agent-id="agentId"
    @click="onClick"
  ><slot /></button>
</template>

<style scoped>
.ui-interactive-card { display: block; width: 100%; min-width: 0; padding: 14px 16px; border: 1px solid transparent; border-radius: var(--radius-md); background: var(--bg-elev); color: var(--text); cursor: pointer; font: inherit; text-align: left; overflow-wrap: anywhere; transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease; }
.ui-interactive-card--outlined { border-color: var(--border); }
.ui-interactive-card--raised { box-shadow: var(--shadow-surface); }
.ui-interactive-card[data-lilia-surface-mode="translucent"] { background: transparent; }
.ui-interactive-card:hover:not(:disabled) { border-color: var(--border-strong); background: var(--lilia-state-layer-hover); }
.ui-interactive-card:active:not(:disabled) { background: var(--lilia-state-layer-pressed); }
.ui-interactive-card.is-selected { border-color: var(--lilia-state-indicator-selected); background: var(--lilia-state-layer-selected); color: var(--lilia-state-foreground-selected); }
.ui-interactive-card.is-selected:hover:not(:disabled) { background: var(--lilia-state-layer-selected-hover); }
.ui-interactive-card.is-selected:active:not(:disabled) { background: var(--lilia-state-layer-selected-pressed); }
.ui-interactive-card:focus-visible { outline: 2px solid var(--lilia-state-focus-ring); outline-offset: 2px; }
.ui-interactive-card:disabled { cursor: not-allowed; opacity: 0.55; }
</style>
