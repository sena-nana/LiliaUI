<script setup lang="ts">
import type {
  SidebarItem,
  SidebarMode,
  SidebarSection,
} from "@lilia/ui-contract";
import { computed, useSlots } from "vue";
import NanaAppShell from "./NanaAppShell.vue";
import NanaSidebar from "./NanaSidebar.vue";

export interface NanaDesktopShellProps {
  title?: string;
  agentId?: string;
  navigation?: readonly SidebarItem[];
  navigationSections?: readonly SidebarSection[];
  settingsItem?: SidebarItem;
  sidebarMode?: SidebarMode;
  contextVisible?: boolean;
  contextTitle?: string;
}

const props = withDefaults(defineProps<NanaDesktopShellProps>(), {
  title: undefined,
  agentId: "nana.shell",
  navigation: () => [],
  navigationSections: () => [],
  settingsItem: undefined,
  sidebarMode: "expanded",
  contextVisible: false,
  contextTitle: undefined,
});

const emit = defineEmits<{
  "update:sidebarMode": [mode: SidebarMode];
  selectNavigation: [item: SidebarItem];
}>();

const slots = useSlots();
const hasSidebar = computed(
  () => Boolean(slots["sidebar-header"])
    || Boolean(slots["sidebar-footer"])
    || props.navigation.length > 0
    || props.navigationSections.length > 0
    || Boolean(props.settingsItem),
);
</script>

<template>
  <NanaAppShell :title="title" :agent-id="agentId">
    <template v-if="$slots['header-leading']" #header-leading>
      <slot name="header-leading" />
    </template>
    <template v-if="$slots['header-center']" #header-center>
      <slot name="header-center" />
    </template>
    <template v-if="$slots['header-actions']" #header-actions>
      <slot name="header-actions" />
    </template>

    <div class="nana-desktop-shell">
      <NanaSidebar
        v-if="hasSidebar"
        :items="navigation"
        :sections="navigationSections"
        :settings-item="settingsItem"
        :mode="sidebarMode"
        :agent-id="`${agentId}.sidebar`"
        @update:mode="emit('update:sidebarMode', $event)"
        @select="emit('selectNavigation', $event)"
      >
        <template v-if="$slots['sidebar-header']" #header>
          <slot name="sidebar-header" />
        </template>
        <template v-if="$slots['sidebar-footer']" #footer>
          <slot name="sidebar-footer" />
        </template>
      </NanaSidebar>

      <main class="nana-desktop-shell__main"><slot /></main>

      <aside
        v-if="contextVisible"
        class="nana-desktop-shell__context"
        :aria-label="contextTitle ?? '属性'"
      >
        <slot name="context" />
      </aside>

      <footer v-if="$slots.status" class="nana-desktop-shell__status">
        <slot name="status" />
      </footer>
    </div>

    <template v-if="$slots.overlays" #overlays>
      <slot name="overlays" />
    </template>
  </NanaAppShell>
</template>

<style scoped>
.nana-desktop-shell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.nana-desktop-shell__main {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.nana-desktop-shell__context {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.nana-desktop-shell__status {
  grid-column: 1 / -1;
}
</style>
