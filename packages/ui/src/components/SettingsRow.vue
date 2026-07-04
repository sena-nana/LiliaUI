<script setup lang="ts">
export interface SettingsRowProps {
  label?: string;
  hint?: string;
  stacked?: boolean;
  loose?: boolean;
  agentId?: string;
}

withDefaults(defineProps<SettingsRowProps>(), {
  label: undefined,
  hint: undefined,
  stacked: false,
  loose: false,
  agentId: undefined,
});
</script>

<template>
  <div class="settings-row" :class="{ 'settings-row--stacked': stacked }" :data-agent-id="agentId">
    <div v-if="label || hint || $slots.label" class="settings-row__label">
      <slot name="label">{{ label }}</slot>
      <div v-if="hint || $slots.hint" class="settings-row__hint">
        <slot name="hint">{{ hint }}</slot>
      </div>
    </div>
    <div class="settings-row__control" :class="{ 'settings-row__control--loose': loose }">
      <slot />
    </div>
  </div>
</template>
