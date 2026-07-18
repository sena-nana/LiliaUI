<script setup lang="ts">
import type { SwitchEmits, SwitchProps } from "@lilia/ui-contract";
const props = withDefaults(defineProps<SwitchProps>(), { modelValue: false, disabled: false, loading: false, invalid: false });
const emit = defineEmits<SwitchEmits>();
function onClick(event: MouseEvent) {
  if (props.disabled || props.loading) return;
  emit("update:modelValue", !props.modelValue);
  emit("change", event);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="nana-switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel ?? label"
    :aria-describedby="ariaDescribedby"
    :aria-invalid="invalid || undefined"
    :aria-busy="loading || undefined"
    :disabled="disabled || loading"
    :data-agent-id="agentId"
    @click="onClick"
  >
    <span class="nana-switch__track"><span class="nana-switch__thumb" /></span>
    <span v-if="label" class="nana-switch__label">{{ label }}</span>
  </button>
</template>
