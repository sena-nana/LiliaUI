<script setup lang="ts">
import { computed, inject } from "vue";
import { RouterView } from "vue-router";
import { APP_METADATA } from "../config/appShell";
import { normalizeSettingsTab, useLiliaSettings } from "../settings";
import { useRouteReturnTarget } from "../composables/useRouteReturnTarget";
import { useShellSidebar } from "../composables/useShellSidebar";
import { liliaShellOptionsKey, resolveShellBoolean } from "../shellOptions";
import TitleBar from "../components/TitleBar.vue";
import SecondaryPanel from "./SecondaryPanel.vue";
import SettingsSidebar from "./SettingsSidebar.vue";
import "../styles/shell.css";

const shellOptions = inject(liliaShellOptionsKey, {});
const settings = useLiliaSettings();
const { route, returnTo } = useRouteReturnTarget();
const sidebarLocked = computed(() => route.meta.lockSidebar === true);
const sidebarVariant = computed(() => route.meta.sidebar ?? "main");
const isSettingsMode = computed(() => sidebarVariant.value === "settings");
const isWorkspaceLayout = computed(() => route.meta.contentLayout === "workspace");
const activeSettingsTab = computed(() => settings
  ? normalizeSettingsTab(settings, route.query.tab)
  : "");
const setupOverlayActive = computed(() => resolveShellBoolean(shellOptions.setupOverlayActive));
const sidebarDisabled = computed(() => sidebarLocked.value || setupOverlayActive.value);
const mainSidebar = computed(() => shellOptions.mainSidebar ?? SecondaryPanel);
const sidebar = useShellSidebar(sidebarDisabled);
</script>

<template>
  <div
    data-agent-id="shell"
    class="shell"
    :class="{
      'is-resizing': sidebar.isResizing.value,
      'is-sidebar-collapsed': sidebar.effectiveCollapsed.value,
      'is-settings-mode': isSettingsMode,
      'is-workspace-layout': isWorkspaceLayout,
      'is-setup-overlay': setupOverlayActive,
    }"
    :style="{ '--sidebar-width': sidebar.widthStyle.value }"
  >
    <TitleBar
      :title="APP_METADATA.productTitle"
      :left-sidebar-collapsed="sidebar.effectiveCollapsed.value"
      :sidebar-toggles-disabled="sidebarDisabled"
      @toggle-left-sidebar="sidebar.toggleCollapsed"
    >
      <template v-if="shellOptions.titlebarActions" #right-actions>
        <component :is="shellOptions.titlebarActions" />
      </template>
    </TitleBar>
    <SettingsSidebar
      v-if="isSettingsMode && settings && !setupOverlayActive"
      :tabs="settings.tabs"
      :active-key="activeSettingsTab"
      :return-to="returnTo"
    />
    <component :is="mainSidebar" v-else-if="!setupOverlayActive" />
    <div
      v-if="!setupOverlayActive"
      data-agent-id="shell.sidebar.resizer"
      class="shell__resizer"
      role="separator"
      aria-orientation="vertical"
      :aria-disabled="sidebar.effectiveCollapsed.value ? 'true' : undefined"
      :aria-valuenow="sidebar.width.value"
      :aria-valuemin="sidebar.minWidth"
      :aria-valuemax="sidebar.maxWidth"
      title="拖动调整侧栏宽度（双击恢复默认）"
      @pointerdown="sidebar.startResize"
      @dblclick="sidebar.resetWidth"
    />
    <main class="shell__main" data-agent-id="shell.main">
      <RouterView />
    </main>
  </div>
</template>
