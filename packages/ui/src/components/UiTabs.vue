<script setup lang="ts">
import type { SelectionEmits, TabsProps } from "@lilia/ui-contract";
import { useTabsPrimitive } from "@lilia/ui-foundation/selection";

type TabValue = string | number;
const props = withDefaults(defineProps<TabsProps<TabValue>>(), {
  orientation: "horizontal",
  ariaLabel: undefined,
  ariaDescribedby: undefined,
  agentId: undefined,
});
const emit = defineEmits<SelectionEmits<TabValue>>();
const tabs = useTabsPrimitive({
  options: () => props.options,
  modelValue: () => props.modelValue,
  orientation: () => props.orientation,
  onSelect(value) {
    emit("update:modelValue", value);
    emit("change", value);
  },
});

function onKeydown(event: KeyboardEvent, index: number) {
  const list = (event.currentTarget as HTMLElement).parentElement;
  tabs.onKeydown(event, index, () => list?.querySelectorAll<HTMLElement>("[role='tab']") ?? []);
}
</script>

<template>
  <div
    class="ui-tabs"
    :class="`ui-tabs--${orientation}`"
    role="tablist"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-orientation="orientation"
    :data-agent-id="agentId"
  >
    <button
      v-for="(option, index) in options"
      :key="String(option.value)"
      class="ui-tabs__tab"
      :class="['lilia-interactive-item', { 'is-active': modelValue === option.value }]"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      :data-lilia-selected="modelValue === option.value ? 'true' : undefined"
      data-lilia-selected-indicator="bottom"
      :tabindex="tabs.tabbableValue.value === option.value ? 0 : -1"
      :disabled="option.disabled"
      :data-agent-id="agentId ? `${agentId}.${String(option.value)}` : undefined"
      @click="tabs.select(option)"
      @keydown="onKeydown($event, index)"
    >{{ option.label }}</button>
  </div>
</template>

<style scoped>
.ui-tabs { display: flex; min-width: 0; gap: 2px; }
.ui-tabs--horizontal { align-items: flex-end; border-bottom: 1px solid var(--border); }
.ui-tabs--vertical { flex-direction: column; align-items: stretch; border-right: 1px solid var(--border); }
.ui-tabs__tab { --lilia-state-selected-shadow: inset 0 -2px 0 var(--lilia-state-indicator-selected); min-width: 0; height: 34px; padding: 0 12px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); cursor: pointer; font: inherit; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background-color 0.12s ease, color 0.12s ease, box-shadow 0.12s ease; }
.ui-tabs__tab:hover:not(:disabled) { background: var(--lilia-state-layer-hover); color: var(--text); }
.ui-tabs__tab:active:not(:disabled) { background: var(--lilia-state-layer-pressed); }
.ui-tabs__tab.is-active { background: var(--lilia-state-layer-selected); color: var(--lilia-state-foreground-selected); }
.ui-tabs__tab.is-active:hover:not(:disabled) { background: var(--lilia-state-layer-selected-hover); }
.ui-tabs__tab.is-active:active:not(:disabled) { background: var(--lilia-state-layer-selected-pressed); }
.ui-tabs__tab:focus-visible { outline: 2px solid var(--lilia-state-focus-ring); outline-offset: -2px; }
.ui-tabs__tab:disabled { cursor: not-allowed; opacity: 0.45; }
</style>
