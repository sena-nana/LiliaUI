<script setup lang="ts">
withDefaults(defineProps<{
  open?: boolean;
  id?: string;
  agentId?: string;
}>(), {
  open: true,
  id: undefined,
  agentId: undefined,
});
</script>

<template>
  <div
    v-if="open"
    :id="id"
    class="lilia-tooltip"
    role="tooltip"
    :data-agent-id="agentId"
  >
    <slot />
  </div>
</template>

<style scoped>
.lilia-tooltip {
  position: absolute;
  box-sizing: border-box;
  max-width: calc(100% - 8px);
  padding: 4px 7px;
  overflow: hidden;
  color: var(--text);
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: 4px;
}
</style>
