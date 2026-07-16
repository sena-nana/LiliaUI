<script setup lang="ts">
import type { ValidationMessageProps } from "@lilia/ui-contract";

withDefaults(defineProps<ValidationMessageProps & { id?: string }>(), {
  intent: "danger",
  id: undefined,
  agentId: undefined,
});
</script>

<template>
  <p
    :id="id"
    class="ui-validation-message"
    :class="`ui-validation-message--${intent}`"
    :data-agent-id="agentId"
    :role="intent === 'danger' ? 'alert' : 'status'"
  >
    <slot>{{ message }}</slot>
  </p>
</template>

<style scoped>
.ui-validation-message { margin: 0; font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
.ui-validation-message--danger { color: var(--err); }
.ui-validation-message--warning { color: var(--warn); }
</style>
