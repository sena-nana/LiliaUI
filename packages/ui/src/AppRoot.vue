<script setup lang="ts">
import { computed, defineAsyncComponent, inject, type Component } from "vue";
import { RouterView } from "vue-router";
import { useContextMenu } from "./composables/useContextMenu";
import { liliaAppOverlaysKey } from "./appOverlays";

const ContextMenuHost = defineAsyncComponent(() => import("./components/ContextMenuHost.vue"));
const { state: contextMenuState } = useContextMenu();
const shouldMountContextMenuHost = computed(() => contextMenuState.openSeq > 0);
const overlays = inject<Component[]>(liliaAppOverlaysKey, []);
</script>

<template>
  <RouterView />
  <ContextMenuHost v-if="shouldMountContextMenuHost" />
  <component
    :is="overlay"
    v-for="(overlay, index) in overlays"
    :key="index"
  />
</template>
