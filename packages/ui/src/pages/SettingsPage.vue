<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  resolveSettingsView,
  useLiliaSettings,
} from "../settings";
import "../styles/page.css";

const route = useRoute();
const settings = useLiliaSettings();
if (!settings) throw new Error("LiliaSettingsPage requires provideLiliaSettings().");
const activeView = computed(() => resolveSettingsView(settings, route.query.tab));
</script>

<template>
  <component
    v-if="activeView.fullPage"
    :is="activeView.section"
    v-bind="activeView.props"
    data-agent-id="settings.full-page-section"
  />
  <section v-else class="settings-page" :data-agent-id="`settings.page.${activeView.key}`">
    <div v-if="!settings.hideHeader" class="page-header">
      <div>
        <h1>{{ activeView.label }}</h1>
        <p v-if="settings.description">{{ settings.description }}</p>
      </div>
    </div>

    <component :is="activeView.section" v-bind="activeView.props" />
  </section>
</template>
