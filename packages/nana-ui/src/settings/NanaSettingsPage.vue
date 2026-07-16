<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { normalizeSettingsTab, useSettings } from "@lilia/ui-foundation/settings";

const route = useRoute();
const settings = useSettings();
if (!settings) throw new Error("NanaSettingsPage requires provideSettings().");
const activeKey = computed(() => normalizeSettingsTab(settings, route.query.tab));
const activeSection = computed(() => settings.sections[activeKey.value]);
const activeProps = computed(() => settings.sectionProps[activeKey.value] ?? {});
const activeLabel = computed(() => settings.tabs.find((tab) => tab.key === activeKey.value)?.label ?? "");
</script>

<template>
  <section class="nana-pattern" :data-agent-id="`nana.settings.${activeKey}`">
    <header v-if="!settings.hideHeader" class="nana-page-header"><div><h1>{{ activeLabel }}</h1><p v-if="settings.description">{{ settings.description }}</p></div></header>
    <component :is="activeSection" v-bind="activeProps" />
  </section>
</template>

<style src="../styles/patterns.css" />
