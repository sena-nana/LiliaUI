<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, type RouteLocationRaw } from "vue-router";
import {
  normalizeSettingsTab,
  useSettings,
  type NavigationTarget,
} from "@lilia/ui-foundation/settings";

const route = useRoute();
const settings = useSettings();
if (!settings) throw new Error("NanaSettingsPage requires provideSettings().");
const activeKey = computed(() => normalizeSettingsTab(settings, route.query.tab));
const activeSection = computed(() => settings.sections[activeKey.value]);
const activeProps = computed(() => settings.sectionProps[activeKey.value] ?? {});
const activeLabel = computed(() => settings.tabs.find((tab) => tab.key === activeKey.value)?.label ?? "");
function routeTarget(target: NavigationTarget): RouteLocationRaw {
  return target as RouteLocationRaw;
}
</script>

<template>
  <section class="nana-pattern nana-settings" :data-agent-id="`nana.settings.${activeKey}`">
    <header v-if="!settings.hideHeader" class="nana-page-header">
      <div><h1>{{ activeLabel }}</h1><p v-if="settings.description">{{ settings.description }}</p></div>
    </header>
    <nav class="nana-settings__nav" aria-label="设置分类" data-agent-id="nana.settings.navigation">
      <RouterLink
        v-for="tab in settings.tabs"
        :key="tab.key"
        :to="routeTarget(tab.to)"
        class="nana-settings__nav-item lilia-interactive-item"
        :class="{ 'is-active': tab.key === activeKey }"
        :aria-current="tab.key === activeKey ? 'page' : undefined"
        :data-lilia-selected="tab.key === activeKey ? 'true' : undefined"
        :data-agent-id="`nana.settings.tab.${tab.key}`"
      ><component :is="tab.icon" :size="18" aria-hidden="true" /><span>{{ tab.label }}</span></RouterLink>
    </nav>
    <div class="nana-settings__content"><component :is="activeSection" v-bind="activeProps" /></div>
  </section>
</template>

<style src="../styles/patterns.css" />
