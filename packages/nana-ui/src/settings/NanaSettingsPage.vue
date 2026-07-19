<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, type RouteLocationRaw } from "vue-router";
import {
  resolveSettingsView,
  useSettings,
  type NavigationTarget,
} from "@lilia/ui-foundation/settings";

const route = useRoute();
const settings = useSettings();
if (!settings) throw new Error("NanaSettingsPage requires provideSettings().");
const activeView = computed(() => resolveSettingsView(settings, route.query.tab));
function routeTarget(target: NavigationTarget): RouteLocationRaw {
  return target as RouteLocationRaw;
}
</script>

<template>
  <component
    v-if="activeView.fullPage"
    :is="activeView.section"
    v-bind="activeView.props"
    data-agent-id="nana.settings.full-page-section"
  />
  <section v-else class="nana-pattern nana-settings" :data-agent-id="`nana.settings.${activeView.key}`">
    <header v-if="!settings.hideHeader" class="nana-page-header">
      <div><h1>{{ activeView.label }}</h1><p v-if="settings.description">{{ settings.description }}</p></div>
    </header>
    <nav class="nana-settings__nav" aria-label="设置分类" data-agent-id="nana.settings.navigation">
      <RouterLink
        v-for="tab in settings.tabs"
        :key="tab.key"
        :to="routeTarget(tab.to)"
        class="nana-settings__nav-item lilia-interactive-item"
        :class="{ 'is-active': tab.key === activeView.key }"
        :aria-current="tab.key === activeView.key ? 'page' : undefined"
        :data-lilia-selected="tab.key === activeView.key ? 'true' : undefined"
        :data-agent-id="`nana.settings.tab.${tab.key}`"
      ><component :is="tab.icon" :size="18" aria-hidden="true" /><span>{{ tab.label }}</span></RouterLink>
    </nav>
    <div class="nana-settings__content"><component :is="activeView.section" v-bind="activeView.props" /></div>
  </section>
</template>

<style src="../styles/patterns.css" />
