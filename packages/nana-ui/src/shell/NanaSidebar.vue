<script setup lang="ts">
import PanelLeftClose from "@lucide/vue/dist/esm/icons/panel-left-close.mjs";
import PanelLeftOpen from "@lucide/vue/dist/esm/icons/panel-left-open.mjs";
import { computed, watch } from "vue";
import { RouterLink } from "vue-router";
import { useSidebarPrimitive } from "@lilia/ui-foundation/sidebar";
import type { SidebarItem, SidebarMode, SurfaceProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import NanaIconButton from "../components/NanaIconButton.vue";
import NanaTooltip from "../components/NanaTooltip.vue";

const props = withDefaults(defineProps<SurfaceProps & {
  items: readonly SidebarItem[];
  mode?: SidebarMode;
  settingsItem?: SidebarItem;
  collapsible?: boolean;
  label?: string;
  agentId?: string;
}>(), {
  mode: "expanded",
  collapsible: true,
  label: "主导航",
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "base",
  surfaceBoundary: true,
});
const emit = defineEmits<{ "update:mode": [mode: SidebarMode]; select: [item: SidebarItem] }>();
const sidebar = useSidebarPrimitive(() => props.items, props.mode);
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
watch(() => props.mode, sidebar.setMode);
function toggle() { sidebar.toggleMode(); emit("update:mode", sidebar.mode.value); }
function selectLink(event: MouseEvent, item: SidebarItem) {
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  emit("select", item);
}
</script>

<template>
  <aside v-bind="surfaceAttributes" class="nana-sidebar" :class="`nana-sidebar--${sidebar.mode.value}`" :data-agent-id="agentId ?? 'nana.shell.sidebar'">
    <header v-if="$slots.header" class="nana-sidebar__header"><slot name="header" /></header>
    <nav class="nana-sidebar__nav" :aria-label="label">
      <NanaTooltip v-for="(item, index) in sidebar.visibleItems.value" :key="item.id" :text="sidebar.mode.value === 'icon' ? item.label : undefined" placement="right">
        <RouterLink
          v-if="item.href"
          :to="item.href"
          class="nana-sidebar__item lilia-interactive-item"
          :class="{ 'is-active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
          :data-lilia-selected="item.active ? 'true' : undefined"
          :aria-label="sidebar.mode.value === 'icon' ? item.label : undefined"
          :aria-disabled="item.disabled || undefined"
          :tabindex="item.disabled ? -1 : 0"
          :data-agent-id="item.agentId"
          :data-sidebar-index="index"
          @click="selectLink($event, item)"
          @keydown="sidebar.onItemKeydown($event, index)"
        >
          <component v-if="item.icon" :is="item.icon" :size="20" aria-hidden="true" />
          <span v-if="sidebar.mode.value === 'expanded'">{{ item.label }}</span>
        </RouterLink>
        <button
          v-else
          type="button"
          class="nana-sidebar__item lilia-interactive-item"
          :class="{ 'is-active': item.active }"
          :aria-pressed="item.active"
          :data-lilia-selected="item.active ? 'true' : undefined"
          :aria-label="sidebar.mode.value === 'icon' ? item.label : undefined"
          :disabled="item.disabled"
          :data-agent-id="item.agentId"
          :data-sidebar-index="index"
          @click="emit('select', item)"
          @keydown="sidebar.onItemKeydown($event, index)"
        >
          <component v-if="item.icon" :is="item.icon" :size="20" aria-hidden="true" />
          <span v-if="sidebar.mode.value === 'expanded'">{{ item.label }}</span>
        </button>
      </NanaTooltip>
    </nav>
    <footer class="nana-sidebar__footer">
      <NanaTooltip v-if="settingsItem" :text="sidebar.mode.value === 'icon' ? settingsItem.label : undefined" placement="right">
        <RouterLink v-if="settingsItem.href" :to="settingsItem.href" class="nana-sidebar__item lilia-interactive-item" :class="{ 'is-active': settingsItem.active }" :aria-current="settingsItem.active ? 'page' : undefined" :data-lilia-selected="settingsItem.active ? 'true' : undefined" :aria-label="sidebar.mode.value === 'icon' ? settingsItem.label : undefined" :aria-disabled="settingsItem.disabled || undefined" :tabindex="settingsItem.disabled ? -1 : 0" :data-agent-id="settingsItem.agentId" @click="selectLink($event, settingsItem)">
          <component v-if="settingsItem.icon" :is="settingsItem.icon" :size="20" aria-hidden="true" />
          <span v-if="sidebar.mode.value === 'expanded'">{{ settingsItem.label }}</span>
        </RouterLink>
        <button v-else type="button" class="nana-sidebar__item lilia-interactive-item" :class="{ 'is-active': settingsItem.active }" :aria-pressed="settingsItem.active" :data-lilia-selected="settingsItem.active ? 'true' : undefined" :aria-label="sidebar.mode.value === 'icon' ? settingsItem.label : undefined" :disabled="settingsItem.disabled" @click="emit('select', settingsItem)">
          <component v-if="settingsItem.icon" :is="settingsItem.icon" :size="20" aria-hidden="true" />
          <span v-if="sidebar.mode.value === 'expanded'">{{ settingsItem.label }}</span>
        </button>
      </NanaTooltip>
      <slot v-if="sidebar.mode.value === 'expanded'" name="footer" />
      <NanaIconButton v-if="collapsible" :icon="sidebar.mode.value === 'expanded' ? PanelLeftClose : PanelLeftOpen" :label="sidebar.mode.value === 'expanded' ? '收起侧边栏' : '展开侧边栏'" agent-id="nana.shell.sidebar.toggle" @click="toggle" />
    </footer>
  </aside>
</template>
