<script setup lang="ts">
import type { AppShellProps, AppShellSlots } from "@lilia/ui-contract";
import NanaTitleBar from "./NanaTitleBar.vue";

withDefaults(defineProps<AppShellProps>(), { title: undefined, agentId: undefined });
defineSlots<AppShellSlots>();
</script>

<template>
  <div class="nana-shell" :data-agent-id="agentId ?? 'nana.shell'">
    <NanaTitleBar :title="title" agent-id="nana.shell.header">
      <template v-if="$slots['header-leading']" #leading><slot name="header-leading" /></template>
      <template v-if="$slots['header-center']" #center><slot name="header-center" /></template>
      <template v-if="$slots['header-actions']" #actions><slot name="header-actions" /></template>
    </NanaTitleBar>
    <div class="nana-shell__content" data-agent-id="nana.shell.content"><slot /></div>
    <div v-if="$slots.overlays" class="nana-shell__overlays" data-agent-id="nana.shell.overlays">
      <slot name="overlays" />
    </div>
  </div>
</template>

<style src="../styles/shell.css" />
