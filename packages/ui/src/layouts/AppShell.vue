<script setup lang="ts">
import type { AppShellProps, AppShellSlots } from "@lilia/ui-contract";
import { computed, inject, type Component } from "vue";
import { APP_METADATA } from "../config/appShell";
import { useNativeAppearance } from "../composables/useNativeAppearance";
import { liliaShellOptionsKey } from "../shellOptions";
import OverlayHost from "../components/OverlayHost.vue";
import TitleBar from "../components/TitleBar.vue";
import "../styles/app-shell.css";

interface LiliaAppShellProps extends AppShellProps {
  overlayComponents?: readonly Component[];
}

interface LiliaAppShellSlots extends AppShellSlots {
  "native-host"?: () => unknown;
}

const props = withDefaults(defineProps<LiliaAppShellProps>(), {
  title: undefined,
  agentId: undefined,
  overlayComponents: () => [],
});
defineSlots<LiliaAppShellSlots>();

const shellOptions = inject(liliaShellOptionsKey, {});
const appearance = useNativeAppearance();
const shellTranslucent = computed(() => appearance.backdropMode.value !== "solid");
const resolvedTitle = computed(() => props.title ?? APP_METADATA.productTitle);
</script>

<template>
  <div
    class="lilia-app-shell"
    :data-agent-id="agentId ?? 'app-shell'"
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
      <template v-if="$slots['header-leading']" #left-actions>
        <slot name="header-leading" />
      </template>
      <template v-if="$slots['header-center']" #center>
        <slot name="header-center" />
      </template>
      <template v-if="$slots['header-actions'] || shellOptions.titlebarActions" #right-actions>
        <slot name="header-actions">
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
