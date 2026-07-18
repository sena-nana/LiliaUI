<script setup lang="ts">
import type { ListItemEmits, ListItemProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<ListItemProps & { type?: "button" | "submit" | "reset" }>(), {
  active: false,
  selected: false,
  disabled: false,
  type: "button",
  agentId: undefined,
});
const emit = defineEmits<ListItemEmits>();

function onClick(event: MouseEvent) {
  if (props.disabled) return;
  emit("select");
  emit("click", event);
}
</script>

<template>
  <button
    class="ui-list-item lilia-interactive-item"
    :class="{ 'is-active': active, 'is-selected': selected }"
    :type="type"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    :aria-pressed="selected"
    :data-lilia-selected="active || selected ? 'true' : undefined"
    :data-agent-id="agentId"
    @click="onClick"
  >
    <span v-if="$slots.leading" class="ui-list-item__leading"><slot name="leading" /></span>
    <span class="ui-list-item__content"><slot /></span>
    <span v-if="$slots.trailing" class="ui-list-item__trailing"><slot name="trailing" /></span>
  </button>
</template>

<style scoped>
.ui-list-item { display: flex; width: 100%; min-width: 0; min-height: 34px; align-items: center; gap: 8px; padding: 6px 9px; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text); cursor: pointer; font: inherit; text-align: left; transition: background-color 0.12s ease, border-color 0.12s ease; }
.ui-list-item:hover:not(:disabled) { background: var(--lilia-state-layer-hover); }
.ui-list-item:active:not(:disabled) { background: var(--lilia-state-layer-pressed); }
.ui-list-item.is-active,
.ui-list-item.is-selected { border-color: var(--lilia-state-indicator-selected); background: var(--lilia-state-layer-selected); color: var(--lilia-state-foreground-selected); }
.ui-list-item.is-active:hover:not(:disabled),
.ui-list-item.is-selected:hover:not(:disabled) { background: var(--lilia-state-layer-selected-hover); }
.ui-list-item.is-active:active:not(:disabled),
.ui-list-item.is-selected:active:not(:disabled) { background: var(--lilia-state-layer-selected-pressed); }
.ui-list-item:focus-visible { outline: 2px solid var(--lilia-state-focus-ring); outline-offset: -2px; }
.ui-list-item:disabled { cursor: not-allowed; opacity: 0.5; }
.ui-list-item__content { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-list-item__leading,
.ui-list-item__trailing { display: inline-flex; flex: 0 0 auto; align-items: center; color: var(--text-muted); }
</style>
