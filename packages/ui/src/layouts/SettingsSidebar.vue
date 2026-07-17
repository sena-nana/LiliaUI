<script setup lang="ts">
import type { SurfaceProps } from "@lilia/ui-contract";
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";
import { RouterLink } from "vue-router";
import ArrowLeft from "@lucide/vue/dist/esm/icons/arrow-left.mjs";
import { computed } from "vue";
import type { SettingsTab, SettingsTabKey } from "../settings";

const props = withDefaults(defineProps<SurfaceProps & {
  tabs: readonly SettingsTab[];
  activeKey: SettingsTabKey;
  returnTo?: string | null;
}>(), {
  surfaceMode: "solid",
  backdropEffect: "none",
  surfaceLevel: "base",
  surfaceBoundary: true,
});
const surfaceAttributes = computed(() => resolveSurfaceAttributes(props));
</script>

<template>
  <aside v-bind="surfaceAttributes" class="secondary-panel settings-sidebar" aria-label="设置分类" data-agent-id="settings.sidebar">
    <div class="secondary-panel__top settings-sidebar__head">
      <RouterLink :to="returnTo || '/'" custom v-slot="{ navigate }">
        <button
          type="button"
          class="settings-sidebar__back lilia-interactive-item"
          aria-label="返回"
          title="返回"
          data-agent-id="settings.sidebar.back"
          @click="navigate"
        >
          <ArrowLeft :size="15" aria-hidden="true" />
          <span>返回</span>
        </button>
      </RouterLink>
    </div>

    <div class="secondary-panel__body">
      <nav class="settings-sidebar__tabs" aria-label="设置分类">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          custom
          v-slot="{ navigate }"
        >
          <button
            type="button"
            class="settings-sidebar__tab lilia-interactive-item"
            :class="{ 'is-active': activeKey === tab.key }"
            :aria-current="activeKey === tab.key ? 'page' : undefined"
            :data-lilia-selected="activeKey === tab.key ? 'true' : undefined"
            :data-agent-id="`settings.tab.${tab.key}`"
            @click="navigate"
          >
            <component
              :is="tab.icon"
              class="settings-sidebar__tab-icon"
              :size="15"
              aria-hidden="true"
            />
            <span class="settings-sidebar__tab-label">{{ tab.label }}</span>
          </button>
        </RouterLink>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.settings-sidebar {
  gap: 12px;
}

.settings-sidebar__head {
  padding: 2px 2px 0;
}

.settings-sidebar__back {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 10px 0 6px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.settings-sidebar__back:hover {
  background: var(--lilia-state-layer-hover);
  filter: none;
}

.settings-sidebar__back:active {
  background: var(--lilia-state-layer-pressed);
}

.settings-sidebar__tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
}

.settings-sidebar__tab {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  text-align: left;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.settings-sidebar__tab:hover {
  background: var(--lilia-state-layer-hover);
  color: var(--text);
  filter: none;
}

.settings-sidebar__tab:active {
  background: var(--lilia-state-layer-pressed);
}

.settings-sidebar__tab.is-active {
  background: var(--lilia-state-layer-selected);
  color: var(--lilia-state-foreground-selected);
  box-shadow: inset 3px 0 0 var(--lilia-state-indicator-selected);
}

.settings-sidebar__tab.is-active:hover {
  background: var(--lilia-state-layer-selected-hover);
}

.settings-sidebar__tab.is-active:active {
  background: var(--lilia-state-layer-selected-pressed);
}

.settings-sidebar__tab-icon {
  justify-self: center;
}

.settings-sidebar__tab-label {
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
