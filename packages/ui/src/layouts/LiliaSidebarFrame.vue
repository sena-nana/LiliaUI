<script setup lang="ts">
import { useSlots } from "vue";
import {
  SIDEBAR_FOOTER_LINKS,
  SIDEBAR_FOOTER_STATUSES,
} from "../config/appShell";
import SidebarFooter from "../components/sidebar/SidebarFooter.vue";

withDefaults(defineProps<{
  agentId?: string;
  ariaLabel?: string;
}>(), {
  agentId: "sidebar.main",
  ariaLabel: undefined,
});

const slots = useSlots();
</script>

<template>
  <aside
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

    <div class="secondary-panel__footer">
      <slot name="footer">
        <SidebarFooter
          :links="SIDEBAR_FOOTER_LINKS"
          :statuses="SIDEBAR_FOOTER_STATUSES"
        />
      </slot>
    </div>
  </aside>
</template>
