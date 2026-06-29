<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { RouterView } from "vue-router";
import { useContextMenu } from "./composables/useContextMenu";

const ContextMenuHost = defineAsyncComponent(() => import("./components/ContextMenuHost.vue"));
const { state: contextMenuState } = useContextMenu();
const shouldMountContextMenuHost = computed(() => contextMenuState.openSeq > 0);
</script>

<template>
  <RouterView />
  <ContextMenuHost v-if="shouldMountContextMenuHost" />
</template>
