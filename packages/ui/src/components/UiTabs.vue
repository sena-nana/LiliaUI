<script setup lang="ts">
import type { TabOption, TabsProps } from "@lilia/ui-contract";
import { computed } from "vue";

type TabValue = string | number;
const props = withDefaults(defineProps<Omit<TabsProps<TabValue>, "modelValue" | "options"> & {
  modelValue: TabValue;
  options: readonly TabOption<TabValue>[];
  ariaLabel?: string;
  "aria-label"?: string;
}>(), {
  orientation: "horizontal",
  ariaLabel: undefined,
  "aria-label": undefined,
  agentId: undefined,
});
const emit = defineEmits<{
  "update:modelValue": [value: TabValue];
  change: [value: TabValue];
}>();
const tabbableValue = computed(() => props.options.some(
  (option) => !option.disabled && option.value === props.modelValue,
) ? props.modelValue : props.options.find((option) => !option.disabled)?.value);

function select(option: TabOption<TabValue>) {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
}

function onKeydown(event: KeyboardEvent, index: number) {
  const previous = props.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const next = props.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  if (![previous, next, "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const available = props.options.map((option, optionIndex) => ({ option, optionIndex }))
    .filter(({ option }) => !option.disabled);
  if (!available.length) return;
  const current = available.findIndex(({ optionIndex }) => optionIndex === index);
  const target = event.key === "Home" ? available[0]
    : event.key === "End" ? available[available.length - 1]
    : available[(current + (event.key === next ? 1 : -1) + available.length) % available.length];
  if (!target) return;
  select(target.option);
  const list = (event.currentTarget as HTMLElement).parentElement;
  list?.querySelectorAll<HTMLButtonElement>("[role='tab']")[target.optionIndex]?.focus();
}
</script>

<template>
  <div
    class="ui-tabs"
    :class="`ui-tabs--${orientation}`"
    role="tablist"
    :aria-label="ariaLabel ?? $props['aria-label']"
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
      :tabindex="tabbableValue === option.value ? 0 : -1"
      :disabled="option.disabled"
      :data-agent-id="agentId ? `${agentId}.${String(option.value)}` : undefined"
      @click="select(option)"
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
.ui-tabs__tab.is-active { background: var(--lilia-state-layer-selected); color: var(--lilia-state-foreground-selected); box-shadow: var(--lilia-state-selected-shadow); }
.ui-tabs__tab.is-active:hover:not(:disabled) { background: var(--lilia-state-layer-selected-hover); }
.ui-tabs__tab.is-active:active:not(:disabled) { background: var(--lilia-state-layer-selected-pressed); }
.ui-tabs__tab:focus-visible { outline: 2px solid var(--lilia-state-focus-ring); outline-offset: -2px; }
.ui-tabs__tab:disabled { cursor: not-allowed; opacity: 0.45; }
</style>
