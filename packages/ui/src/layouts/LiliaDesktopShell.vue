<script setup lang="ts">
import { computed, useSlots } from "vue";
import LiliaAppShell from "./AppShell.vue";
import {
  LiliaBottomPanel,
  LiliaInspector,
  LiliaPrimaryContent,
  LiliaSectionNavigation,
  LiliaWorkspace,
} from "../workspace";
import LiliaSidebarSection from "../components/sidebar/LiliaSidebarSection.vue";
import LiliaSidebarNavRow from "../components/sidebar/SidebarNavRow.vue";
import SidebarFooter from "../components/sidebar/SidebarFooter.vue";
import type {
  SidebarFooterLink,
  SidebarFooterStatus,
  SidebarNavItem,
} from "../config/appShell";

export interface LiliaDesktopShellNavSection {
  title: string;
  items: readonly SidebarNavItem[];
  count?: number;
  agentId?: string;
}

export interface LiliaDesktopShellProps {
  title?: string;
  agentId?: string;
  navigation?: readonly SidebarNavItem[];
  navigationSections?: readonly LiliaDesktopShellNavSection[];
  footerLinks?: readonly SidebarFooterLink[];
  footerStatuses?: readonly SidebarFooterStatus[];
  navCollapsed?: boolean;
  navSize?: number;
}

const props = withDefaults(defineProps<LiliaDesktopShellProps>(), {
  title: undefined,
  agentId: "app-shell",
  navigation: () => [],
  navigationSections: () => [],
  footerLinks: () => [],
  footerStatuses: () => [],
  navCollapsed: undefined,
  navSize: undefined,
});

const emit = defineEmits<{
  "update:navCollapsed": [value: boolean];
  "update:navSize": [value: number];
}>();

const slots = useSlots();
const hasNavigation = computed(
  () => Boolean(slots.navigation)
    || props.navigation.length > 0
    || props.navigationSections.length > 0,
);
const hasFooter = computed(
  () => Boolean(slots["nav-footer"])
    || props.footerLinks.length > 0
    || props.footerStatuses.length > 0,
);
</script>

<template>
  <LiliaAppShell :title="title" :agent-id="agentId">
    <template v-if="$slots['header-leading']" #header-leading>
      <slot name="header-leading" />
    </template>
    <template v-if="$slots['header-center']" #header-center>
      <slot name="header-center" />
    </template>
    <template v-if="$slots['header-actions']" #header-actions>
      <slot name="header-actions" />
    </template>

    <LiliaWorkspace :aria-label="`${title ?? '应用'} 工作区`">
      <LiliaSectionNavigation
        v-if="hasNavigation"
        id="navigation"
        collapsible
        resizable
        overflow="hidden"
        :collapsed="navCollapsed"
        :size="navSize"
        @update:collapsed="emit('update:navCollapsed', $event)"
        @update:size="emit('update:navSize', $event)"
      >
        <div class="lilia-desktop-shell__nav">
          <div class="lilia-desktop-shell__nav-body">
            <slot name="navigation">
              <LiliaSidebarSection
                v-for="section in navigationSections"
                :key="section.title"
                :title="section.title"
                :count="section.count"
                :agent-id="section.agentId ?? `${agentId}.nav.section.${section.title}`"
              >
                <LiliaSidebarNavRow
                  v-for="item in section.items"
                  :key="item.key"
                  :item="item"
                  :agent-id="`${agentId}.nav.${item.key}`"
                />
              </LiliaSidebarSection>
              <LiliaSidebarNavRow
                v-for="item in navigation"
                :key="item.key"
                :item="item"
                :agent-id="`${agentId}.nav.${item.key}`"
              />
            </slot>
          </div>
          <div v-if="hasFooter" class="lilia-desktop-shell__nav-footer">
            <slot name="nav-footer">
              <SidebarFooter :links="footerLinks" :statuses="footerStatuses" />
            </slot>
          </div>
        </div>
      </LiliaSectionNavigation>

      <LiliaPrimaryContent id="primary">
        <slot />
      </LiliaPrimaryContent>

      <LiliaInspector v-if="$slots.inspector" id="primary-inspector" collapsible resizable>
        <slot name="inspector" />
      </LiliaInspector>

      <LiliaBottomPanel v-if="$slots.bottom" id="primary-bottom" resizable>
        <slot name="bottom" />
      </LiliaBottomPanel>
    </LiliaWorkspace>

    <template v-if="$slots.overlays" #overlays>
      <slot name="overlays" />
    </template>
  </LiliaAppShell>
</template>

<style scoped>
.lilia-desktop-shell__nav {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.lilia-desktop-shell__nav-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lilia-desktop-shell__nav-footer {
  flex: 0 0 auto;
  min-width: 0;
}
</style>
