<script setup lang="ts">
import { useButtonPrimitive } from "@lilia/ui-foundation/button";
import type { ButtonEmits, ButtonProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<ButtonProps>(), {
  type: "button",
  variant: "secondary",
  size: "md",
  disabled: false,
  loading: false,
  agentId: undefined,
});
const emit = defineEmits<ButtonEmits>();
const button = useButtonPrimitive(props);
</script>

<template>
  <button
    :type="type"
    class="nana-button"
    :class="[`nana-button--${variant}`, `nana-button--${size}`]"
    :disabled="button.disabled.value"
    :aria-busy="button.ariaBusy.value"
    :aria-invalid="invalid || undefined"
    :data-agent-id="agentId"
    @click="button.onPress($event) && emit('click', $event)"
  >
    <span v-if="loading" class="nana-button__spinner" aria-hidden="true" />
    <slot name="icon" />
    <span class="nana-button__label"><slot /></span>
  </button>
</template>
