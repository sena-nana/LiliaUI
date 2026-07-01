<script setup lang="ts">
import Moon from "@lucide/vue/dist/esm/icons/moon.mjs";
import Radius from "@lucide/vue/dist/esm/icons/radius.mjs";
import SquareRoundCorner from "@lucide/vue/dist/esm/icons/square-round-corner.mjs";
import Sun from "@lucide/vue/dist/esm/icons/sun.mjs";
import SettingsRow from "../../components/SettingsRow.vue";
import UiCard from "../../components/UiCard.vue";
import UiRangeField from "../../components/UiRangeField.vue";
import UiSegmentedControl, {
  type UiSegmentedOption,
} from "../../components/UiSegmentedControl.vue";
import {
  CORNER_RADIUS_MAX,
  CORNER_RADIUS_MIN,
  useCornerStyle,
} from "../../composables/useCornerStyle";
import { useTheme } from "../../composables/useTheme";

const { theme, setTheme } = useTheme();
const { cornerStyle, cornerRadius, setCornerRadius, setCornerStyle } = useCornerStyle();

const themeOptions: UiSegmentedOption[] = [
  {
    value: "dark",
    label: "暗色",
    icon: Moon,
    agentId: "settings.appearance.theme.dark",
  },
  {
    value: "light",
    label: "浅色",
    icon: Sun,
    agentId: "settings.appearance.theme.light",
  },
];

const cornerOptions: UiSegmentedOption[] = [
  {
    value: "smooth",
    label: "平滑",
    icon: SquareRoundCorner,
    agentId: "settings.appearance.corner.smooth",
  },
  {
    value: "round",
    label: "普通",
    icon: Radius,
    agentId: "settings.appearance.corner.round",
  },
];

function onThemeChange(value: string | number) {
  if (value === "dark" || value === "light") setTheme(value);
}

function onCornerStyleChange(value: string | number) {
  if (value === "smooth" || value === "round") setCornerStyle(value);
}
</script>

<template>
  <UiCard title="外观" agent-id="settings.appearance">
    <SettingsRow label="主题" hint="选择应用配色，立即生效并记忆到本地。">
      <UiSegmentedControl
        :model-value="theme"
        :options="themeOptions"
        aria-label="主题"
        @update:model-value="onThemeChange"
      />
    </SettingsRow>
    <SettingsRow label="语言" hint="模板默认使用简体中文界面文案。">
      <span class="muted">简体中文</span>
    </SettingsRow>
    <SettingsRow label="圆角" hint="选择平滑超椭圆或普通圆角，立即全局生效。">
      <UiSegmentedControl
        :model-value="cornerStyle"
        :options="cornerOptions"
        aria-label="圆角"
        @update:model-value="onCornerStyleChange"
      />
    </SettingsRow>
    <SettingsRow label="圆角半径" hint="调节普通与平滑圆角的全局半径。">
      <UiRangeField
        :model-value="cornerRadius"
        :min="CORNER_RADIUS_MIN"
        :max="CORNER_RADIUS_MAX"
        :step="1"
        unit="px"
        aria-label="圆角半径"
        agent-id="settings.appearance.corner-radius"
        @update:model-value="setCornerRadius"
      />
    </SettingsRow>
  </UiCard>
</template>
