<script setup lang="ts">
import type { ValidationMessageProps } from "@lilia/ui-contract";
withDefaults(defineProps<ValidationMessageProps>(), { intent: "danger" });
</script>

<template>
  <p class="nana-validation" :class="`nana-validation--${intent}`" :role="intent === 'danger' ? 'alert' : 'status'" :data-agent-id="agentId">
    {{ message }}
  </p>
</template>
