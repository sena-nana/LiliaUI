<script setup lang="ts">
import PanelRightOpen from "@lucide/vue/dist/esm/icons/panel-right-open.mjs";
import { computed, ref, watch } from "vue";
import { RouterView } from "vue-router";
import { useResponsiveMode } from "@lilia/ui-foundation/responsive";
import type { SidebarItem, SidebarMode, SidebarSection } from "@lilia/ui-contract";
import NanaDrawer from "../components/NanaDrawer.vue";
import NanaIconButton from "../components/NanaIconButton.vue";
import NanaSidebar from "./NanaSidebar.vue";
import NanaTitleBar from "./NanaTitleBar.vue";

const props = withDefaults(defineProps<{
  title?: string;
  navigation?: readonly SidebarItem[];
  navigationSections?: readonly SidebarSection[];
  settingsItem?: SidebarItem;
  sidebarMode?: SidebarMode;
  contextVisible?: boolean;
  contextTitle?: string;
  agentId?: string;
}>(), {
  title: "",
  navigation: () => [],
  navigationSections: () => [],
  settingsItem: undefined,
  sidebarMode: "expanded",
  contextVisible: false,
  contextTitle: "属性",
  agentId: undefined,
});
const emit = defineEmits<{
  "update:sidebarMode": [mode: SidebarMode];
  selectNavigation: [item: SidebarItem];
}>();
const narrow = useResponsiveMode();
const chosenMode = ref(props.sidebarMode);
const effectiveMode = computed(() => narrow.value ? "icon" : chosenMode.value);
const contextDrawerOpen = ref(false);
watch(() => props.sidebarMode, (mode) => { chosenMode.value = mode; });
watch(() => props.contextVisible, (visible) => { if (!visible) contextDrawerOpen.value = false; });
function updateMode(mode: SidebarMode) { chosenMode.value = mode; emit("update:sidebarMode", mode); }
</script>

<template>
  <div class="nana-shell" :class="{ 'is-narrow': narrow }" :data-agent-id="agentId ?? 'nana.shell'">
    <NanaTitleBar :title="title"><template #leading><slot name="titlebar-leading" /></template></NanaTitleBar>
    <header class="nana-shell__top" data-agent-id="nana.shell.top">
      <div class="nana-shell__project"><slot name="project" /></div>
      <div class="nana-shell__states"><slot name="save-state" /><slot name="device-state" /><slot name="runtime-state" /></div>
      <NanaIconButton v-if="narrow && contextVisible" :icon="PanelRightOpen" label="打开属性" agent-id="nana.shell.context.open" @click="contextDrawerOpen = true" />
    </header>
    <NanaSidebar
      :items="navigation"
      :sections="navigationSections"
      :settings-item="settingsItem"
      :mode="effectiveMode"
      @update:mode="updateMode"
      @select="emit('selectNavigation', $event)"
    ><template #header><slot name="sidebar-header" /></template><template #footer><slot name="sidebar-footer" /></template></NanaSidebar>
    <main class="nana-shell__main" data-agent-id="nana.shell.main"><slot><RouterView /></slot></main>
    <aside v-if="contextVisible && !narrow" class="nana-shell__context" data-agent-id="nana.shell.context"><slot name="context" /></aside>
    <footer v-if="$slots.status" class="nana-shell__status" data-agent-id="nana.shell.status"><slot name="status" /></footer>
    <NanaDrawer v-if="narrow" :open="contextVisible && contextDrawerOpen" :title="contextTitle" @close="contextDrawerOpen = false"><slot name="context" /></NanaDrawer>
  </div>
</template>

<style src="../styles/shell.css" />
