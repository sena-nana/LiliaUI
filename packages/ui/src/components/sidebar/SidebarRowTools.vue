<script setup lang="ts">
import UiIconButton from "../UiIconButton.vue";
import type { SidebarActionItem } from "../../config/appShell";

defineProps<{
  tools: SidebarActionItem[];
  agentIdBase?: string;
}>();

function selectTool(tool: SidebarActionItem) {
  if (tool.disabled || !tool.onSelect) return;
  void tool.onSelect();
}
</script>

<template>
  <div class="sb-tree__hover-tools" @click.stop>
    <UiIconButton
      v-for="tool in tools"
      :key="tool.key"
      class="sb-icon-btn"
      size="sm"
      :icon="tool.icon"
      :label="tool.label"
      :active="tool.active"
      :disabled="tool.disabled || !tool.onSelect"
      :agent-id="agentIdBase ? `${agentIdBase}.${tool.key}` : undefined"
      @click="selectTool(tool)"
    />
  </div>
</template>

<style scoped>
.sb-tree__hover-tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

</style>
