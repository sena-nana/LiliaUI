<script setup lang="ts">
import { computed } from "vue";
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
import {
  BACKDROP_OPACITY_MAX,
  BACKDROP_OPACITY_MIN,
  useNativeAppearance,
} from "../../composables/useNativeAppearance";

const { theme, setTheme } = useTheme();
const { cornerStyle, cornerRadius, setCornerRadius, setCornerStyle } = useCornerStyle();
const {
  backdropMode,
  backdropOpacity,
  platform,
  setBackdropMode,
  setBackdropOpacity,
} = useNativeAppearance();

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

const backdropOptions: UiSegmentedOption[] = (() => {
  if (platform === "macos") {
    return [
      {
        value: "system",
        label: "系统透明",
        agentId: "settings.appearance.backdrop.system",
      },
      {
        value: "solid",
        label: "实色",
        agentId: "settings.appearance.backdrop.solid",
      },
    ];
  }
  if (platform === "windows") {
    return [
      {
        value: "mica",
        label: "Mica",
        agentId: "settings.appearance.backdrop.mica",
      },
      {
        value: "acrylic",
        label: "Acrylic",
        agentId: "settings.appearance.backdrop.acrylic",
      },
      {
        value: "solid",
        label: "实色",
        agentId: "settings.appearance.backdrop.solid",
      },
    ];
  }
  return [];
})();

const backdropOpacityPercent = computed({
  get: () => Math.round(backdropOpacity.value * 100),
  set: (value: number) => setBackdropOpacity(value / 100),
});
const backdropOpacityHint = computed(() => backdropMode.value === "solid"
  ? "实色模式不使用透明度；切回透明材质后会恢复当前数值。"
  : "调节标题栏与侧栏材质的前景色覆盖程度。",
);

function onThemeChange(value: string | number) {
  if (value === "dark" || value === "light") setTheme(value);
}

function onCornerStyleChange(value: string | number) {
  if (value === "smooth" || value === "round") setCornerStyle(value);
}

function onBackdropChange(value: string | number) {
  if (value === "system" || value === "mica" || value === "acrylic" || value === "solid") {
    setBackdropMode(value);
  }
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
    <SettingsRow
      v-if="platform !== 'linux'"
      label="窗口材质"
      hint="选择标题栏与侧栏使用的原生背景材质。"
      agent-id="settings.appearance.backdrop"
    >
      <UiSegmentedControl
        :model-value="backdropMode"
        :options="backdropOptions"
        aria-label="窗口材质"
        @update:model-value="onBackdropChange"
      />
    </SettingsRow>
    <SettingsRow
      v-if="platform !== 'linux'"
      label="材质不透明度"
      :hint="backdropOpacityHint"
      agent-id="settings.appearance.backdrop-opacity-row"
    >
      <UiRangeField
        v-model="backdropOpacityPercent"
        :min="BACKDROP_OPACITY_MIN * 100"
        :max="BACKDROP_OPACITY_MAX * 100"
        :step="1"
        unit="%"
        aria-label="材质不透明度"
        agent-id="settings.appearance.backdrop-opacity"
        :disabled="backdropMode === 'solid'"
      />
    </SettingsRow>
    <SettingsRow label="组件圆角" hint="选择卡片与控件使用的平滑或普通圆角。">
      <UiSegmentedControl
        :model-value="cornerStyle"
        :options="cornerOptions"
        aria-label="圆角"
        @update:model-value="onCornerStyleChange"
      />
    </SettingsRow>
    <SettingsRow label="组件圆角半径" hint="调节卡片与控件的圆角半径。">
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
