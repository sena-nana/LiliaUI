<script setup lang="ts" generic="T extends string | number">
/**
 * 自定义锚定选择菜单：支持单/多选、图标、hint 与 `v-model`。
 * 仅需原生表单语义的单选场景改用 `UiSelect`；需要坐标触发的 action 列表改用 `AnchoredActionMenu`。
 */
import { computed, ref, watch } from "vue";
import ChevronDown from "@lucide/vue/dist/esm/icons/chevron-down.mjs";
import { SB_MENU_POP_TRANSITION_MS } from "../composables/menuMotion";
import { useAnchoredMenuMotion } from "../composables/useAnchoredMenuMotion";
import { useDismissableLayer } from "@lilia/ui-foundation/overlay";
import { useOverlayPresence } from "../composables/useOverlayActivity";
import "./action-menu.css";

interface Option {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
  agentId?: string;
}

type DropdownSize = "small" | "large";

const props = defineProps<{
  modelValue: T | readonly T[];
  options: readonly Option[];
  icon?: unknown;
  placeholder?: string;
  displayLabel?: string;
  multiple?: boolean;
  placement?: "top" | "bottom";
  disabled?: boolean;
  block?: boolean;
  size?: DropdownSize;
  buttonClass?: string;
  hideButtonLabel?: boolean;
  agentId?: string;
  menuWidth?: string;
  menuLabel?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: any] }>();

const open = ref(false);
const overlayPresence = useOverlayPresence();
const placement = computed(() =>
  props.placement === "bottom" ? "bottom" : "top",
);
const matchMenuWidth = computed(() => props.block === true);
const sizeClass = computed(() => `dd--${props.size ?? "small"}`);
const rootClasses = computed(() => [
  sizeClass.value,
  { "dd--block": props.block },
]);
const menuMotion = useAnchoredMenuMotion(open, placement, matchMenuWidth);

const current = computed(() =>
  props.multiple ? undefined : props.options.find((option) => option.value === props.modelValue),
);
const selectedValues = computed(() =>
  props.multiple && Array.isArray(props.modelValue) ? props.modelValue : [],
);
const selectedValueSet = computed(() => new Set(selectedValues.value));
const buttonLabel = computed(() => {
  if (props.displayLabel) return props.displayLabel;
  if (!props.multiple) return current.value?.label ?? props.placeholder ?? "-";
  const labels: string[] = [];
  let selectedCount = 0;
  for (const option of props.options) {
    if (!selectedValueSet.value.has(option.value)) continue;
    selectedCount += 1;
    if (labels.length < 2) labels.push(option.label);
  }
  if (!selectedCount) return props.placeholder ?? "-";
  if (selectedCount <= 2) return labels.join(", ");
  return `${labels.join(", ")} +${selectedCount - 2}`;
});

const menuStyle = computed(() => [
  menuMotion.overlayStyle.value,
  props.menuWidth ? { width: props.menuWidth } : null,
]);

function toggle(event: MouseEvent) {
  if (props.disabled) return;
  menuMotion.captureAnchor(event);
  open.value = !open.value;
}

function pick(option: Option) {
  if (option.disabled) return;
  if (props.multiple) {
    const values = selectedValues.value;
    emit(
      "update:modelValue",
      selectedValueSet.value.has(option.value)
        ? values.filter((value) => value !== option.value)
        : [...values, option.value],
    );
    return;
  }
  emit("update:modelValue", option.value);
  open.value = false;
}

function isSelected(option: Option) {
  return props.multiple
    ? selectedValueSet.value.has(option.value)
    : option.value === props.modelValue;
}

useDismissableLayer({
  open,
  closeOnOutside: true,
  closeOnEscape: true,
  containsTarget: menuMotion.containsTarget,
  stopEscapePropagation: true,
  close: () => {
    open.value = false;
  },
});

watch(open, (value) => {
  if (value) overlayPresence.activate();
  if (!value) {
    menuMotion.clearAnchor();
  }
});

function onAfterLeave() {
  if (!open.value) overlayPresence.deactivate();
}
</script>

<template>
  <div class="dd" :class="rootClasses">
    <button
      :ref="menuMotion.triggerEl"
      type="button"
      class="dd__button"
      :class="[buttonClass, { 'is-open': open, 'is-disabled': disabled }]"
      :data-agent-id="agentId"
      :disabled="disabled"
      :aria-label="hideButtonLabel ? buttonLabel : undefined"
      :aria-haspopup="true"
      :aria-expanded="open"
      @click="toggle"
    >
      <component v-if="icon" :is="icon" :size="13" aria-hidden="true" />
      <span
        class="dd__button-label"
        :class="{ 'dd__button-label--visually-hidden': hideButtonLabel }"
      >
        {{ buttonLabel }}
      </span>
      <ChevronDown :size="12" aria-hidden="true" class="dd__button-caret" />
    </button>

    <Teleport to="body">
      <Transition
        name="sb-menu-pop"
        :duration="SB_MENU_POP_TRANSITION_MS"
        @after-leave="onAfterLeave"
      >
        <div
          v-if="open"
          :ref="menuMotion.menuEl"
          class="dd__menu"
          data-lilia-surface-mode="solid"
          data-lilia-backdrop="none"
          data-lilia-surface-level="overlay"
          data-lilia-surface-boundary
          :class="sizeClass"
          role="listbox"
          :aria-multiselectable="multiple ? 'true' : undefined"
          :aria-label="menuLabel"
          :style="menuStyle"
        >
          <button
            v-for="option in options"
            :key="String(option.value)"
            v-memo="[option.value, option.label, option.hint, option.disabled, option.agentId, multiple, isSelected(option)]"
            type="button"
            class="dd__item lilia-interactive-item"
            :class="{ 'is-active': isSelected(option), 'is-multiple': multiple }"
            :disabled="option.disabled"
            role="option"
            :aria-selected="isSelected(option)"
            :data-lilia-selected="isSelected(option) ? 'true' : undefined"
            :data-agent-id="option.agentId"
            @click="pick(option)"
          >
            <span v-if="multiple" class="dd__item-check" aria-hidden="true">
              <span v-if="isSelected(option)"></span>
            </span>
            <span class="dd__item-label">{{ option.label }}</span>
            <span v-if="option.hint" class="dd__item-hint">{{ option.hint }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dd {
  position: relative;
  display: inline-flex;
  min-width: 0;
}

.dd--block {
  display: flex;
  width: 100%;
}

.dd__button {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  min-width: 0;
  max-width: 100%;
  text-align: left;
}

.dd--block .dd__button {
  width: 100%;
}

.dd--large .dd__button {
  height: 34px;
  padding: 0 11px;
  gap: 7px;
  font-size: 13px;
}

.dd__button:hover:not(.is-disabled):not(:disabled),
.dd__button.is-open {
  background: var(--bg-hover);
  color: var(--text);
  filter: none;
}

.dd__button-label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.dd--block .dd__button-label,
.dd--large .dd__button-label {
  max-width: none;
}

.dd__button-label--visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.dd__menu {
  position: fixed;
  left: 0;
  top: 0;
  z-index: var(--z-dropdown, 1900);
  min-width: 180px;
  max-width: 280px;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 3px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: var(--shadow-menu);
  contain: layout paint style;
  max-height: 280px;
  overflow: auto;
  transform-origin: var(--sb-menu-origin-x, 0px) var(--sb-menu-origin-y, 0px);
}

.dd__menu.dd--large {
  min-width: 220px;
  max-width: 420px;
  padding: 4px;
  max-height: 340px;
}

.dd__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 7px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  min-height: 26px;
  height: auto;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.45;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
}

.dd__menu.dd--large .dd__item {
  gap: 8px;
  padding: 5px 9px;
  min-height: 32px;
  font-size: 13px;
}

.dd__item:hover:not(:disabled),
.dd__item.is-active {
  background: var(--lilia-state-layer-hover);
  filter: none;
}

.dd__item.is-active {
  background: var(--lilia-state-layer-selected);
  color: var(--lilia-state-foreground-selected);
}

.dd__item.is-active:hover:not(:disabled) {
  background: var(--lilia-state-layer-selected-hover);
}

.dd__item:active:not(:disabled) {
  background: var(--lilia-state-layer-pressed);
}

.dd__item.is-active:active:not(:disabled) {
  background: var(--lilia-state-layer-selected-pressed);
}

.dd__item:focus-visible {
  outline: 2px solid var(--lilia-state-focus-ring);
  outline-offset: -2px;
}

.dd__item.is-multiple {
  align-items: center;
}

.dd__item-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 13px;
  height: 13px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--bg-subtle);
}

.dd__item-check span {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--accent);
}

.dd__item:disabled {
  cursor: default;
  opacity: 0.45;
}

.dd__item:disabled:hover {
  background: transparent;
}

.dd__item-label {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd__item-hint {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-faint);
}

.dd__menu.dd--large .dd__item-hint {
  font-size: 11px;
}
</style>
