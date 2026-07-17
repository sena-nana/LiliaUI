<script setup lang="ts">
import type { SurfaceProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import { computed, useSlots } from "vue";
import {
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUSES,
} from "../config/appShell";
import SidebarFooter from "../components/sidebar/SidebarFooter.vue";
import "../styles/sidebar.css";

const props = withDefaults(defineProps<SurfaceProps & {
  agentId?: string;
  ariaLabel?: string;
  defaultFooter?: boolean;
}>(), {
  agentId: "sidebar.main",
  ariaLabel: undefined,
  defaultFooter: true,
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "base",
  surfaceBoundary: true,
});

const slots = useSlots();
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
</script>

<template>
  <aside
    v-bind="surfaceAttributes"
    class="secondary-panel"
    :aria-label="ariaLabel"
    :data-agent-id="agentId"
  >
    <div v-if="slots.top" class="secondary-panel__top">
      <slot name="top" />
    </div>

    <div class="secondary-panel__body">
      <slot name="body">
        <slot />
      </slot>
    </div>

    <div v-if="slots.footer || defaultFooter" class="secondary-panel__footer">
      <slot name="footer">
        <SidebarFooter
          :links="SIDEBAR_FOOTER_LINKS"
          :statuses="SIDEBAR_FOOTER_STATUSES"
        />
      </slot>
    </div>
  </aside>
</template>
