<script setup lang="ts">
import { Moon, Radius, SquareRoundCorner, Sun } from "@lucide/vue";
import {
  CORNER_RADIUS_MAX,
  CORNER_RADIUS_MIN,
  useCornerStyle,
} from "../../composables/useCornerStyle";
import { useTheme } from "../../composables/useTheme";

const { theme, setTheme } = useTheme();
const { cornerStyle, cornerRadius, setCornerRadius, setCornerStyle } = useCornerStyle();

function onCornerRadiusInput(event: Event) {
  setCornerRadius(Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="card" data-agent-id="settings.appearance">
    <h2>外观</h2>
    <div class="settings-row">
      <div class="settings-row__label">
        <div>主题</div>
        <div class="settings-row__hint">选择应用配色，立即生效并记忆到本地。</div>
      </div>
      <div class="segmented" role="radiogroup" aria-label="主题">
        <button
          type="button"
          role="radio"
          :aria-checked="theme === 'dark'"
          :class="{ 'is-active': theme === 'dark' }"
          data-agent-id="settings.appearance.theme.dark"
          @click="setTheme('dark')"
        >
          <Moon :size="14" aria-hidden="true" />
          暗色
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="theme === 'light'"
          :class="{ 'is-active': theme === 'light' }"
          data-agent-id="settings.appearance.theme.light"
          @click="setTheme('light')"
        >
          <Sun :size="14" aria-hidden="true" />
          浅色
        </button>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row__label">
        <div>语言</div>
        <div class="settings-row__hint">模板默认使用简体中文界面文案。</div>
      </div>
      <span class="muted">简体中文</span>
    </div>
    <div class="settings-row">
      <div class="settings-row__label">
        <div>圆角</div>
        <div class="settings-row__hint">选择平滑超椭圆或普通圆角，立即全局生效。</div>
      </div>
      <div class="segmented" role="radiogroup" aria-label="圆角">
        <button
          type="button"
          role="radio"
          :aria-checked="cornerStyle === 'smooth'"
          :class="{ 'is-active': cornerStyle === 'smooth' }"
          data-agent-id="settings.appearance.corner.smooth"
          @click="setCornerStyle('smooth')"
        >
          <SquareRoundCorner :size="14" aria-hidden="true" />
          平滑
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="cornerStyle === 'round'"
          :class="{ 'is-active': cornerStyle === 'round' }"
          data-agent-id="settings.appearance.corner.round"
          @click="setCornerStyle('round')"
        >
          <Radius :size="14" aria-hidden="true" />
          普通
        </button>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row__label">
        <div>圆角半径</div>
        <div class="settings-row__hint">调节普通与平滑圆角的全局半径。</div>
      </div>
      <div class="radius-control">
        <input
          type="range"
          :min="CORNER_RADIUS_MIN"
          :max="CORNER_RADIUS_MAX"
          step="1"
          :value="cornerRadius"
          aria-label="圆角半径"
          data-agent-id="settings.appearance.corner-radius"
          @input="onCornerRadiusInput"
        />
        <output>{{ cornerRadius }}px</output>
      </div>
    </div>
  </div>
</template>
