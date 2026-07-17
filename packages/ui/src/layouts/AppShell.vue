<script setup lang="ts">
import { computed, inject } from "vue";
import { RouterView } from "vue-router";
import { APP_METADATA } from "../config/appShell";
import { normalizeSettingsTab, useLiliaSettings } from "../settings";
import { useRouteReturnTarget } from "../composables/useRouteReturnTarget";
import { useShellSidebar } from "../composables/useShellSidebar";
import { useNativeAppearance } from "../composables/useNativeAppearance";
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
const appearance = useNativeAppearance();
const shellTranslucent = computed(() => appearance.backdropMode.value !== "solid");
const sidebarTranslucent = computed(() => shellTranslucent.value && appearance.backdropTarget.value === "sidebar");
const mainTranslucent = computed(() => shellTranslucent.value && appearance.backdropTarget.value === "main");
const titlebarTranslucent = computed(() => sidebarTranslucent.value && appearance.titlebarFollowsSidebar.value);
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
    :data-lilia-surface-mode="shellTranslucent ? 'translucent' : 'solid'"
    :data-lilia-backdrop="shellTranslucent ? 'native' : 'none'"
    data-lilia-surface-level="base"
    data-lilia-surface-boundary
  >
    <TitleBar
      :title="APP_METADATA.productTitle"
      :left-sidebar-collapsed="sidebar.effectiveCollapsed.value"
      :sidebar-toggles-disabled="sidebarDisabled"
      @toggle-left-sidebar="sidebar.toggleCollapsed"
      :data-lilia-surface-mode="titlebarTranslucent ? 'translucent' : 'solid'"
      data-lilia-backdrop="none"
      data-lilia-surface-level="raised"
      data-lilia-surface-boundary
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
      :surface-mode="sidebarTranslucent ? 'translucent' : 'solid'"
      backdrop-effect="none"
      surface-level="base"
      surface-boundary
    />
    <component
      :is="mainSidebar"
      v-else-if="!setupOverlayActive"
      :surface-mode="sidebarTranslucent ? 'translucent' : 'solid'"
      backdrop-effect="none"
      surface-level="base"
      surface-boundary
    />
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
    <main
      class="shell__main"
      data-agent-id="shell.main"
      :data-lilia-surface-mode="mainTranslucent ? 'translucent' : 'solid'"
      data-lilia-backdrop="none"
      data-lilia-surface-level="base"
      data-lilia-surface-boundary
    >
      <RouterView />
    </main>
  </div>
</template>
