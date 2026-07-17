<script setup lang="ts">
import { computed, inject, type Component } from "vue";
import { APP_METADATA } from "../config/appShell";
import { useNativeAppearance } from "../composables/useNativeAppearance";
import { liliaShellOptionsKey } from "../shellOptions";
import OverlayHost from "../components/OverlayHost.vue";
import TitleBar from "../components/TitleBar.vue";
import "../styles/app-shell.css";

const props = withDefaults(defineProps<{
  title?: string;
  overlayComponents?: readonly Component[];
}>(), {
  title: undefined,
  overlayComponents: () => [],
});

const shellOptions = inject(liliaShellOptionsKey, {});
const appearance = useNativeAppearance();
const shellTranslucent = computed(() => appearance.backdropMode.value !== "solid");
const resolvedTitle = computed(() => props.title ?? APP_METADATA.productTitle);
</script>

<template>
  <div
    class="lilia-app-shell"
    data-agent-id="app-shell"
    :data-lilia-surface-mode="shellTranslucent ? 'translucent' : 'solid'"
    :data-lilia-backdrop="shellTranslucent ? 'native' : 'none'"
    data-lilia-surface-level="base"
    data-lilia-surface-boundary
  >
    <TitleBar
      :title="resolvedTitle"
      :show-sidebar-toggle="false"
      :data-lilia-surface-mode="shellTranslucent ? 'translucent' : 'solid'"
      data-lilia-backdrop="none"
      data-lilia-surface-level="raised"
      data-lilia-surface-boundary
    >
      <template v-if="$slots['titlebar-leading']" #left-actions>
        <slot name="titlebar-leading" />
      </template>
      <template v-if="$slots['titlebar-center']" #center>
        <slot name="titlebar-center" />
      </template>
      <template v-if="$slots['titlebar-actions'] || shellOptions.titlebarActions" #right-actions>
        <slot name="titlebar-actions">
          <component :is="shellOptions.titlebarActions" />
        </slot>
      </template>
    </TitleBar>
    <div class="lilia-app-shell__content" data-agent-id="app-shell.content">
      <slot />
    </div>
    <div v-if="$slots['native-host']" class="lilia-app-shell__native-host" data-agent-id="app-shell.native-host">
      <slot name="native-host" />
    </div>
    <OverlayHost :components="overlayComponents">
      <slot name="overlays" />
    </OverlayHost>
  </div>
</template>
