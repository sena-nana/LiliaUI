<script setup lang="ts">
import type { VisualLayerComponents } from "./types";

const props = defineProps<{
  density: "comfortable" | "compact";
  layer: "lilia" | "nana";
  longText: boolean;
  theme: "light" | "dark";
  ui: VisualLayerComponents;
}>();

const providerProps = props.layer === "nana"
  ? {
      theme: props.theme,
      policy: { density: props.density },
      storageKeyPrefix: `visual-${props.theme}-${props.density}`,
    }
  : { class: "visual-provider", "data-density": props.density };
const longLabel = props.longText
  ? "这是用于验证百分之二百缩放和连续超长内容不会遮挡关键操作的应用状态说明-example.with.a.very.long.identifier.without-spaces"
  : "长文本应换行，关键操作保持可见。";
</script>

<template>
  <component :is="ui.Provider ?? 'div'" v-bind="providerProps">
    <main class="visual-fixture" :data-layer="layer" data-visual-critical="fixture">
      <header>
        <div><strong>{{ layer === "nana" ? "NanaUI" : "LiliaUI" }}</strong><span>{{ theme }} · {{ density }}</span></div>
        <component :is="ui.StatusBadge" label="运行正常" tone="success" />
      </header>
      <component :is="ui.Card" variant="outlined" selected data-visual-critical="card">
        <p class="visual-long" data-visual-critical="long-text">{{ longLabel }}</p>
        <component :is="ui.FormField" label="项目名称" hint="输入边界与焦点状态">
          <component
            :is="ui.Input"
            model-value="示例项目"
            aria-label="项目名称"
            agent-id="visual.input"
          />
        </component>
        <component :is="ui.Checkbox" :model-value="true" label="启用自动保存" />
        <component :is="ui.Progress" label="正在准备资源" :value="64" />
        <component :is="ui.Skeleton" width="72%" height="12px" agent-id="visual.motion" />
        <div class="visual-actions" data-visual-critical="actions">
          <component :is="ui.Button" variant="primary" agent-id="visual.hover">主要操作</component>
          <component :is="ui.Button" variant="secondary" loading>加载中</component>
          <component :is="ui.Button" variant="secondary" disabled>不可用</component>
        </div>
      </component>
      <section class="visual-surfaces" aria-label="Surface state fixtures">
        <div
          class="visual-surface visual-surface--solid"
          data-lilia-surface-mode="solid"
          data-lilia-backdrop="none"
          data-lilia-surface-level="base"
          data-lilia-surface-boundary
        >
          <strong>Solid</strong>
          <component :is="ui.ListItem" selected agent-id="visual.surface.solid.selected">Selected list item</component>
          <component
            :is="ui.Tabs"
            model-value="selected"
            :options="[{ value: 'selected', label: 'Selected' }, { value: 'idle', label: 'Idle' }]"
            aria-label="Solid tabs"
          />
        </div>
        <div
          class="visual-surface visual-surface--translucent"
          data-lilia-surface-mode="translucent"
          data-lilia-backdrop="css-blur"
          data-lilia-surface-level="base"
          data-lilia-surface-boundary
        >
          <strong>Translucent</strong>
          <component :is="ui.ListItem" selected agent-id="visual.surface.translucent.selected">Selected list item</component>
          <component
            :is="ui.InteractiveCard"
            selected
            surface-mode="translucent"
            backdrop-effect="none"
            surface-level="raised"
            surface-boundary
          >Selected card</component>
        </div>
      </section>
    </main>
  </component>
</template>

<style>
html, body, #app { width: 100%; min-height: 100%; margin: 0; }
body { overflow: auto !important; background: var(--bg); }
.visual-provider { min-height: 100%; background: var(--bg); color: var(--text); }
.visual-fixture, .visual-fixture * { font-family: Arial, sans-serif !important; }
.visual-fixture { display: grid; min-width: 0; gap: 10px; padding: 12px; background: var(--bg); color: var(--text); }
.visual-fixture > header { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 8px; }
.visual-fixture > header > div { display: flex; min-width: 0; flex-direction: column; }
.visual-fixture > header span { color: var(--text-muted); font-size: 12px; }
.visual-fixture .nana-card, .visual-fixture .ui-card { display: grid; min-width: 0; gap: 9px; padding: 12px; }
.visual-long { min-width: 0; margin: 0; color: var(--text-muted); overflow-wrap: anywhere; }
.visual-actions { display: flex; min-width: 0; flex-wrap: wrap; gap: 7px; }
.visual-surfaces { display: grid; min-width: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.visual-surface { min-width: 0; padding: 10px; display: grid; gap: 7px; border-radius: var(--radius-md); }
.visual-surface--solid { background: var(--bg-elev); }
.visual-surface--translucent { background: var(--lilia-backdrop-surface, oklch(100% 0 0 / 0.12)); }
.visual-surface > strong { color: var(--text-muted); font-size: 12px; }
@media (max-width: 520px) { .visual-surfaces { grid-template-columns: minmax(0, 1fr); } }
</style>
