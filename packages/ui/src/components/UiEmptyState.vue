<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  message?: string;
  icon?: unknown;
  agentId?: string;
}>(), {
  title: undefined,
  message: undefined,
  icon: undefined,
  agentId: undefined,
});
</script>

<template>
  <div class="empty-state ui-empty-state" :data-agent-id="agentId">
    <slot name="icon">
      <component v-if="icon" :is="icon" :size="24" aria-hidden="true" />
    </slot>
    <div v-if="title || $slots.title" class="ui-empty-state__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div v-if="message || $slots.default" class="ui-empty-state__message">
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<style scoped>
.ui-empty-state__title {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.ui-empty-state__message {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
