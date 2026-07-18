<script setup lang="ts">
import { computed } from "vue";
import type { NativeBackdropMode } from "@lilia/ui-foundation/native-appearance";
import type { UIDensity } from "@lilia/ui-contract";
import type { UITheme } from "@lilia/ui-foundation/theme";
import NanaCard from "../components/NanaCard.vue";
import NanaSegmentedControl from "../components/NanaSegmentedControl.vue";
import { useNanaUI } from "../provider/context";

const ui = useNanaUI();
const themeOptions = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "暗色" },
] as const;
const densityOptions = [
  { value: "comfortable", label: "舒适" },
  { value: "compact", label: "紧凑" },
] as const;
const backdropOptions = computed(() => ui.platform === "windows"
  ? [
      { value: "mica", label: "Mica" },
      { value: "acrylic", label: "Acrylic" },
      { value: "solid", label: "实色" },
    ] as const
  : ui.platform === "macos"
    ? [{ value: "system", label: "系统材质" }, { value: "solid", label: "实色" }] as const
    : [{ value: "solid", label: "实色" }] as const,
);

function setTheme(value: string | number) {
  if (value === "system" || value === "light" || value === "dark") ui.setTheme(value as UITheme);
}
function setDensity(value: string | number) {
  if (value === "comfortable" || value === "compact") ui.setDensity(value as UIDensity);
}
function setBackdrop(value: string | number) {
  if (value === "mica" || value === "acrylic" || value === "system" || value === "solid") {
    ui.setBackdropMode(value as NativeBackdropMode);
  }
}
</script>

<template>
  <NanaCard agent-id="settings.appearance">
    <div class="nana-settings-card__header"><h2>外观</h2><p>选择主题、界面密度与窗口材质。</p></div>
    <div class="nana-setting-row">
      <div><strong>主题</strong><span>立即应用并保存在本机。</span></div>
      <NanaSegmentedControl :model-value="ui.theme.value" :options="themeOptions" aria-label="主题" agent-id="settings.appearance.theme" @update:model-value="setTheme" />
    </div>
    <div class="nana-setting-row">
      <div><strong>界面密度</strong><span>调整控件与页面的整体间距。</span></div>
      <NanaSegmentedControl :model-value="ui.policy.value.density" :options="densityOptions" aria-label="界面密度" agent-id="settings.appearance.density" @update:model-value="setDensity" />
    </div>
    <div class="nana-setting-row">
      <div><strong>窗口材质</strong><span>透明材质不可用时自动回退到实色。</span></div>
      <NanaSegmentedControl :model-value="ui.backdropMode.value" :options="backdropOptions" aria-label="窗口材质" agent-id="settings.appearance.backdrop" @update:model-value="setBackdrop" />
    </div>
  </NanaCard>
</template>
