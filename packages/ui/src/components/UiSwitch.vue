<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean;
  label?: string;
  hint?: string;
  disabled?: boolean;
  agentId?: string;
}>(), {
  label: undefined,
  hint: undefined,
  disabled: false,
  agentId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [event: Event];
}>();

function onChange(event: Event) {
  if (props.disabled) return;
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
  emit("change", event);
}
</script>

<template>
  <label class="ui-switch" :class="{ 'ui-switch--with-label': label || hint || $slots.default }">
    <input
      type="checkbox"
      class="ui-switch__input"
      :checked="modelValue"
      :disabled="disabled"
      :data-agent-id="agentId"
      @change="onChange"
    />
    <span class="ui-switch__track" aria-hidden="true"></span>
    <span v-if="label || hint || $slots.default" class="ui-switch__text">
      <span class="ui-switch__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="hint" class="ui-switch__hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.ui-switch--with-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ui-switch__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;
}

.ui-switch__label {
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
}

.ui-switch__hint {
  color: var(--text-muted);
  font-size: 12px;
}
</style>
