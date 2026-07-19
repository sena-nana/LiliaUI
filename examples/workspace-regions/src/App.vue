<script setup lang="ts">
import { computed, ref } from "vue";
import { LiliaAppShell } from "@lilia/ui/shell";
import {
  LiliaBottomPanel,
  LiliaGlobalNavigation,
  LiliaInspector,
  LiliaPrimaryContent,
  LiliaResourcePanel,
  LiliaSectionNavigation,
  LiliaWorkspace,
  LiliaWorkspaceRegion,
} from "@lilia/ui/layouts";
import NativeViewportCanvas from "./NativeViewportCanvas.vue";

type ExampleLayout = "code" | "github" | "live2d";

const activeLayout = ref<ExampleLayout>("code");
const activeNavigation = ref("workspace");
const selectedEntry = ref("current");
const resourcesCollapsed = ref(false);
const inspectorCollapsed = ref(false);
const title = computed(() => ({
  code: "LiliaCode",
  github: "LiliaGithub",
  live2d: "Live2DEditor",
})[activeLayout.value]);
</script>

<template>
  <LiliaAppShell :title="title">
    <template #header-leading>
      <div class="layout-switcher" aria-label="示例布局">
        <button
          v-for="layout in (['code', 'github', 'live2d'] as const)"
          :key="layout"
          type="button"
          :class="{ 'is-active': activeLayout === layout }"
          :aria-pressed="activeLayout === layout"
          @click="activeLayout = layout"
        >
          {{ { code: 'Code', github: 'Github', live2d: 'Live2D' }[layout] }}
        </button>
      </div>
    </template>

    <LiliaWorkspace :aria-label="`${title} 工作区`">
      <LiliaGlobalNavigation v-if="activeLayout !== 'live2d'" id="global-navigation">
        <div class="icon-rail" aria-label="全局导航">
          <button type="button" aria-label="工作区" :aria-pressed="activeNavigation === 'workspace'" @click="activeNavigation = 'workspace'">W</button>
          <button type="button" aria-label="搜索" :aria-pressed="activeNavigation === 'search'" @click="activeNavigation = 'search'">S</button>
        </div>
      </LiliaGlobalNavigation>

      <LiliaSectionNavigation v-if="activeLayout === 'code'" id="section-navigation">
        <header>项目</header>
        <button type="button" :aria-pressed="selectedEntry === 'source'" @click="selectedEntry = 'source'">源代码</button>
        <button type="button" :aria-pressed="selectedEntry === 'changes'" @click="selectedEntry = 'changes'">变更</button>
      </LiliaSectionNavigation>

      <LiliaResourcePanel
        id="resources"
        v-model:collapsed="resourcesCollapsed"
        collapsible
        resizable
      >
        <header>{{ activeLayout === 'github' ? '仓库' : '资源' }}</header>
        <button type="button" :aria-pressed="selectedEntry === 'current'" @click="selectedEntry = 'current'">当前项目</button>
        <button type="button" :aria-pressed="selectedEntry === 'recent'" @click="selectedEntry = 'recent'">最近打开</button>
      </LiliaResourcePanel>

      <LiliaWorkspaceRegion
        v-if="activeLayout === 'github'"
        id="pull-requests"
        role="section-navigation"
        placement="start"
        :default-size="230"
        resizable
      >
        <header>Pull Requests</header>
        <button type="button" :aria-pressed="selectedEntry === 'review'" @click="selectedEntry = 'review'">等待审查</button>
        <button type="button" :aria-pressed="selectedEntry === 'merged'" @click="selectedEntry = 'merged'">已合并</button>
      </LiliaWorkspaceRegion>

      <LiliaWorkspaceRegion
        id="primary-toolbar"
        role="utility"
        placement="top"
        scope="primary"
      >
        <div class="toolbar">
          <strong>{{ title }}</strong>
          <button type="button" @click="resourcesCollapsed = !resourcesCollapsed">
            {{ resourcesCollapsed ? '显示资源' : '隐藏资源' }}
          </button>
          <button type="button" @click="inspectorCollapsed = !inspectorCollapsed">
            {{ inspectorCollapsed ? '显示检查器' : '隐藏检查器' }}
          </button>
        </div>
      </LiliaWorkspaceRegion>

      <LiliaPrimaryContent id="example-primary">
        <NativeViewportCanvas v-if="activeLayout === 'live2d'" />
        <div v-else class="editor-surface">
          <span>{{ activeLayout === 'code' ? 'main.ts' : 'Pull request #12' }}</span>
        </div>
      </LiliaPrimaryContent>

      <LiliaInspector
        id="inspector"
        v-model:collapsed="inspectorCollapsed"
        collapsible
        resizable
      >
        <header>检查器</header>
        <dl class="inspector-values">
          <dt>名称</dt><dd>{{ title }}</dd>
          <dt>当前项</dt><dd>{{ selectedEntry }}</dd>
        </dl>
      </LiliaInspector>

      <LiliaBottomPanel
        v-if="activeLayout !== 'github'"
        id="bottom-panel"
        :role="activeLayout === 'live2d' ? 'timeline' : 'console'"
        resizable
      >
        <header>{{ activeLayout === 'live2d' ? '时间轴' : '控制台' }}</header>
      </LiliaBottomPanel>
    </LiliaWorkspace>
  </LiliaAppShell>
</template>
