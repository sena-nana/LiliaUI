<script setup lang="ts">
import PanelLeftClose from "@lucide/vue/dist/esm/icons/panel-left-close.mjs";
import PanelLeftOpen from "@lucide/vue/dist/esm/icons/panel-left-open.mjs";
import { computed, watch } from "vue";
import { RouterLink } from "vue-router";
import { useSidebarPrimitive } from "@lilia/ui-foundation/sidebar";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import type {
  SidebarAction,
  SidebarItem,
  SidebarMode,
  SidebarSection,
  SurfaceProps,
} from "@lilia/ui-contract";
import NanaIconButton from "../components/NanaIconButton.vue";

const props = withDefaults(defineProps<SurfaceProps & {
  items?: readonly SidebarItem[];
  sections?: readonly SidebarSection[];
  mode?: SidebarMode;
  settingsItem?: SidebarItem;
  collapsible?: boolean;
  label?: string;
  agentId?: string;
}>(), {
  items: () => [],
  sections: () => [],
  mode: "expanded",
  settingsItem: undefined,
  collapsible: true,
  label: "主导航",
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "base",
  surfaceBoundary: true,
});

const emit = defineEmits<{
  "update:mode": [mode: SidebarMode];
  select: [item: SidebarItem];
}>();
const flattenedItems = computed(() => [
  ...props.items,
  ...props.sections.flatMap((section) => section.items),
]);
const sidebar = useSidebarPrimitive(() => flattenedItems.value, props.mode);
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
watch(() => props.mode, sidebar.setMode);

function toggle() {
  sidebar.toggleMode();
  emit("update:mode", sidebar.mode.value);
}

function itemIndex(item: SidebarItem) {
  return sidebar.visibleItems.value.indexOf(item);
}

function isItemVisible(item: SidebarItem) {
  return itemIndex(item) >= 0;
}

function selectLink(event: MouseEvent, item: SidebarItem) {
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  emit("select", item);
}

function runAction(event: Event, action: SidebarAction) {
  event.preventDefault();
  event.stopPropagation();
  if (!action.disabled) void action.run();
}
</script>

<template>
  <aside
    v-bind="surfaceAttributes"
    class="nana-sidebar"
    :class="`nana-sidebar--${sidebar.mode.value}`"
    :data-agent-id="agentId ?? 'nana.shell.sidebar'"
  >
    <header v-if="$slots.header" class="nana-sidebar__header"><slot name="header" /></header>
    <nav class="nana-sidebar__nav" :aria-label="label">
      <template v-for="item in items" :key="item.id">
        <component
          v-if="isItemVisible(item)"
          :is="item.href ? RouterLink : 'button'"
          :to="item.href"
          :type="item.href ? undefined : 'button'"
          class="nana-sidebar__item lilia-interactive-item"
          :class="{ 'is-active': item.active }"
          :aria-current="item.active && item.href ? 'page' : undefined"
          :aria-pressed="!item.href ? item.active : undefined"
          :aria-label="sidebar.mode.value === 'icon' ? item.label : undefined"
          :title="sidebar.mode.value === 'icon' ? item.label : undefined"
          :aria-disabled="item.disabled || undefined"
          :disabled="!item.href ? item.disabled : undefined"
          :tabindex="item.disabled ? -1 : 0"
          :data-agent-id="item.agentId"
          :data-sidebar-index="itemIndex(item)"
          :data-lilia-selected="item.active ? 'true' : undefined"
          @click="selectLink($event, item)"
          @keydown="sidebar.onItemKeydown($event, itemIndex(item))"
        >
          <component v-if="item.icon" :is="item.icon" :size="20" aria-hidden="true" />
          <span v-if="sidebar.mode.value === 'expanded'" class="nana-sidebar__label">{{ item.label }}</span>
        </component>
      </template>

      <section
        v-for="section in sections"
        :key="section.id"
        class="nana-sidebar__section"
        :data-agent-id="section.agentId"
      >
        <header v-if="sidebar.mode.value === 'expanded'" class="nana-sidebar__section-header">
          <span>{{ section.label }}</span>
          <button
            v-for="action in section.actions"
            :key="action.id"
            type="button"
            class="nana-sidebar__action"
            :aria-label="action.label"
            :title="action.label"
            :disabled="action.disabled"
            :data-agent-id="action.agentId"
            @click="runAction($event, action)"
          ><component v-if="action.icon" :is="action.icon" :size="14" aria-hidden="true" /></button>
        </header>
        <p v-if="section.items.length === 0 && sidebar.mode.value === 'expanded'" class="nana-sidebar__empty">
          {{ section.emptyText }}
        </p>
        <div v-for="item in section.items" :key="item.id" class="nana-sidebar__row">
          <component
            v-if="isItemVisible(item)"
            :is="item.href ? RouterLink : 'button'"
            :to="item.href"
            :type="item.href ? undefined : 'button'"
            class="nana-sidebar__item lilia-interactive-item"
            :class="{ 'is-active': item.active }"
            :aria-current="item.active && item.href ? 'page' : undefined"
            :aria-pressed="!item.href ? item.active : undefined"
            :aria-label="sidebar.mode.value === 'icon' ? item.label : undefined"
            :title="sidebar.mode.value === 'icon' ? item.label : undefined"
            :aria-disabled="item.disabled || undefined"
            :disabled="!item.href ? item.disabled : undefined"
            :tabindex="item.disabled ? -1 : 0"
            :data-agent-id="item.agentId"
            :data-sidebar-index="itemIndex(item)"
            :data-lilia-selected="item.active ? 'true' : undefined"
            @click="selectLink($event, item)"
            @keydown="sidebar.onItemKeydown($event, itemIndex(item))"
          >
            <component v-if="item.icon" :is="item.icon" :size="20" aria-hidden="true" />
            <span v-if="sidebar.mode.value === 'expanded'" class="nana-sidebar__label">{{ item.label }}</span>
            <span v-if="sidebar.mode.value === 'expanded' && item.badges?.length" class="nana-sidebar__badges">
              <span
                v-for="badge in item.badges"
                :key="badge.id"
                class="nana-sidebar__badge"
                :class="`is-${badge.tone ?? 'neutral'}`"
                :data-agent-id="badge.agentId"
              >{{ badge.label }}</span>
            </span>
          </component>
          <div v-if="sidebar.mode.value === 'expanded' && item.actions?.length" class="nana-sidebar__actions">
            <button
              v-for="action in item.actions"
              :key="action.id"
              type="button"
              class="nana-sidebar__action"
              :class="{ 'is-active': action.active }"
              :aria-label="action.label"
              :title="action.label"
              :disabled="action.disabled"
              :data-agent-id="action.agentId"
              @click="runAction($event, action)"
            ><component v-if="action.icon" :is="action.icon" :size="14" aria-hidden="true" /></button>
          </div>
        </div>
      </section>
    </nav>
    <footer class="nana-sidebar__footer">
      <component
        :is="settingsItem?.href ? RouterLink : 'button'"
        v-if="settingsItem"
        :to="settingsItem.href"
        :type="settingsItem.href ? undefined : 'button'"
        class="nana-sidebar__item lilia-interactive-item"
        :class="{ 'is-active': settingsItem.active }"
        :aria-current="settingsItem.active && settingsItem.href ? 'page' : undefined"
        :aria-label="sidebar.mode.value === 'icon' ? settingsItem.label : undefined"
        :title="sidebar.mode.value === 'icon' ? settingsItem.label : undefined"
        :data-agent-id="settingsItem.agentId"
        @click="selectLink($event, settingsItem)"
      >
        <component v-if="settingsItem.icon" :is="settingsItem.icon" :size="20" aria-hidden="true" />
        <span v-if="sidebar.mode.value === 'expanded'">{{ settingsItem.label }}</span>
      </component>
      <slot v-if="sidebar.mode.value === 'expanded'" name="footer" />
      <NanaIconButton
        v-if="collapsible"
        :icon="sidebar.mode.value === 'expanded' ? PanelLeftClose : PanelLeftOpen"
        :label="sidebar.mode.value === 'expanded' ? '收起侧边栏' : '展开侧边栏'"
        agent-id="nana.shell.sidebar.toggle"
        @click="toggle"
      />
    </footer>
  </aside>
</template>
