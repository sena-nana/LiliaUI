<script setup lang="ts" generic="T extends string | number">
/**
 * 原生 `<select>` 表单选择器：单选、可访问、可被表单原生提交流程识别。
 * 需要多选、图标、hint、自定义锚定菜单时改用 `Dropdown`。
 */
import type { SelectEmits, SelectOption, SelectProps, UIControlSize } from "@lilia/ui-contract";

export type UiSelectOption<T extends string | number = string | number> = SelectOption<T>;
type UiSelectSize = UIControlSize;

const props = withDefaults(defineProps<Omit<SelectProps<T>, "size"> & {
  size?: UiSelectSize;
}>(), {
  size: "md",
  disabled: false,
  loading: false,
  invalid: false,
  ariaLabel: undefined,
  ariaDescribedby: undefined,
  agentId: undefined,
});

const emit = defineEmits<SelectEmits<T>>();

function onChange(event: Event) {
  const rawValue = (event.target as HTMLSelectElement).value;
  const selected = props.options.find((option) => String(option.value) === rawValue);
  if (selected) emit("update:modelValue", selected.value);
  emit("change", event);
}
</script>

<template>
  <select
    class="ui-select"
    :class="`ui-select--${size}`"
    :value="modelValue"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="invalid || undefined"
    :aria-label="props.ariaLabel"
    :aria-describedby="props.ariaDescribedby"
    :data-agent-id="agentId"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option
      v-for="option in options"
      :key="`${typeof option.value}:${option.value}`"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
.ui-select {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  transition: border-color 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
}

.ui-select--md {
  height: 30px;
  padding: 0 28px 0 9px;
}

.ui-select--sm {
  height: 28px;
  padding: 0 26px 0 8px;
}

.ui-select--lg {
  height: 36px;
  padding: 0 32px 0 11px;
  font-size: 14px;
}

.ui-select:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.ui-select:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
  outline: none;
}

.ui-select:disabled {
  background-color: var(--bg-subtle);
  color: var(--text-faint);
  cursor: not-allowed;
  opacity: 0.68;
}
</style>
