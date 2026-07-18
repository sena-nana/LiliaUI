<script setup lang="ts">
import Home from "@lucide/vue/dist/esm/icons/house.mjs";
import Pencil from "@lucide/vue/dist/esm/icons/pencil.mjs";
import Settings from "@lucide/vue/dist/esm/icons/settings.mjs";
import Sparkles from "@lucide/vue/dist/esm/icons/sparkles.mjs";
import { NanaUIProvider } from "@lilia/nana-ui/provider";
import { NanaAppShell, NanaSidebar } from "@lilia/nana-ui/shell";
import type { SidebarItem } from "@lilia/ui-contract";
import { computed, markRaw } from "vue";
import { RouterView, useRoute } from "vue-router";

const route = useRoute();
const primaryNavigation = [
  { id: "home", label: "首页", href: "/", icon: markRaw(Home) },
  { id: "editor", label: "编辑", href: "/editor", icon: markRaw(Pencil) },
  { id: "onboarding", label: "首次启动", href: "/onboarding", icon: markRaw(Sparkles) },
] as const;

const navigation = computed<SidebarItem[]>(() => primaryNavigation.map((item) => ({
  ...item,
  active: route.path === item.href,
  agentId: `example.navigation.${item.id}`,
})));
const settingsItem = computed<SidebarItem>(() => ({
  id: "settings",
  label: "设置",
  href: "/settings",
  icon: markRaw(Settings),
  active: route.path === "/settings",
  agentId: "example.navigation.settings",
}));
</script>

<template>
  <NanaUIProvider agent-id="example.nana-provider">
    <NanaAppShell title="Nana 示例项目" agent-id="example.nana-shell">
      <template #header-actions><span>已保存 · 设备已连接 · 待机</span></template>
      <div class="example-workspace">
        <NanaSidebar :items="navigation" :settings-item="settingsItem" />
        <main><RouterView /></main>
      </div>
    </NanaAppShell>
  </NanaUIProvider>
</template>

<style scoped>
.example-workspace { min-width: 0; min-height: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); }
.example-workspace > main { min-width: 0; min-height: 0; overflow: auto; }
</style>
