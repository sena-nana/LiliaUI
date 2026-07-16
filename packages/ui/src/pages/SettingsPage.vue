<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  normalizeSettingsTab,
  useLiliaSettings,
} from "../settings";
import "../styles/page.css";

const route = useRoute();
const settings = useLiliaSettings();
if (!settings) throw new Error("LiliaSettingsPage requires provideLiliaSettings().");
const activeTab = computed(() => normalizeSettingsTab(settings, route.query.tab));
const activeTabSection = computed(() => settings.sections[activeTab.value]);
const activeTabProps = computed(() => settings.sectionProps[activeTab.value] ?? {});
const activeTabLabel = computed(
  () => settings.tabs.find((tab) => tab.key === activeTab.value)?.label ?? "",
);
const isFullPageSection = computed(() => settings.fullPageTabs.has(activeTab.value));
</script>

<template>
  <component
    v-if="isFullPageSection"
    :is="activeTabSection"
    v-bind="activeTabProps"
    data-agent-id="settings.full-page-section"
  />
  <section v-else class="settings-page" :data-agent-id="`settings.page.${activeTab}`">
    <div v-if="!settings.hideHeader" class="page-header">
      <div>
        <h1>{{ activeTabLabel }}</h1>
        <p v-if="settings.description">{{ settings.description }}</p>
      </div>
    </div>

    <component :is="activeTabSection" v-bind="activeTabProps" />
  </section>
</template>
