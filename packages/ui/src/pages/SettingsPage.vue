<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  APP_SHELL_COPY,
  SETTINGS_CONFIG,
  SETTINGS_SECTION_PROPS,
  SETTINGS_SECTIONS,
  SETTINGS_TABS,
  normalizeSettingsTab,
} from "../config/appShell";
import "../styles/page.css";

const route = useRoute();
const activeTab = computed(() => normalizeSettingsTab(route.query.tab));
const activeTabSection = computed(() => SETTINGS_SECTIONS[activeTab.value]);
const activeTabProps = computed(() => SETTINGS_SECTION_PROPS[activeTab.value] ?? {});
const activeTabLabel = computed(
  () => SETTINGS_TABS.find((tab) => tab.key === activeTab.value)?.label ?? "设置",
);
const isFullPageSection = computed(() => SETTINGS_CONFIG.fullPageTabs.has(activeTab.value));
</script>

<template>
  <component
    v-if="isFullPageSection"
    :is="activeTabSection"
    v-bind="activeTabProps"
    data-agent-id="settings.full-page-section"
  />
  <section v-else class="settings-page" :data-agent-id="`settings.page.${activeTab}`">
    <div v-if="!SETTINGS_CONFIG.hideHeader" class="page-header">
      <div>
        <h1>{{ activeTabLabel }}</h1>
        <p>{{ APP_SHELL_COPY.settingsDescription }}</p>
      </div>
    </div>

    <component :is="activeTabSection" v-bind="activeTabProps" />
  </section>
</template>
