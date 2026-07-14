import { invoke } from "@tauri-apps/api/core";
import { readonly, ref, watch, type Ref } from "vue";
import {
  APP_METADATA,
  getLiliaAppConfig,
  type BackdropMode,
  type NativePlatform,
} from "../config/appShell";
import { useTheme } from "./useTheme";

export interface NativeAppearanceSettings {
  backdropMode: BackdropMode;
  backdropOpacity: number;
}

declare global {
  interface Window {
    __LILIA_NATIVE_PLATFORM__?: NativePlatform;
  }
}

export const BACKDROP_OPACITY_MIN = 0.28;
export const BACKDROP_OPACITY_MAX = 0.92;
export const BACKDROP_OPACITY_DEFAULT = 0.64;

const DEFAULT_BACKDROP_BY_PLATFORM: Record<NativePlatform, BackdropMode> = {
  macos: "system",
  windows: "mica",
  linux: "solid",
};

interface NativeAppearanceState {
  platform: NativePlatform;
  backdropMode: Ref<BackdropMode>;
  backdropOpacity: Ref<number>;
}

let appearanceState: NativeAppearanceState | null = null;
let nativeSyncInFlight = false;
let pendingNativeState: { mode: BackdropMode; dark: boolean } | null = null;

function modeStorageKey() {
  return `${APP_METADATA.storageKeyPrefix}.backdropMode`;
}

function opacityStorageKey() {
  return `${APP_METADATA.storageKeyPrefix}.backdropOpacity`;
}

function isBackdropMode(value: unknown): value is BackdropMode {
  return value === "system" || value === "mica" || value === "acrylic" || value === "solid";
}

export function resolveNativePlatform(value: unknown): NativePlatform {
  return value === "macos" || value === "windows" || value === "linux" ? value : "linux";
}

export function normalizeBackdropMode(
  value: unknown,
  nativePlatform: NativePlatform,
): BackdropMode {
  if (nativePlatform === "macos") return value === "solid" ? "solid" : "system";
  if (nativePlatform === "windows") {
    return value === "mica" || value === "acrylic" || value === "solid" ? value : "mica";
  }
  return "solid";
}

export function clampBackdropOpacity(value: number): number {
  const finiteValue = Number.isFinite(value) ? value : BACKDROP_OPACITY_DEFAULT;
  return Math.min(BACKDROP_OPACITY_MAX, Math.max(BACKDROP_OPACITY_MIN, finiteValue));
}

function readNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "linux";
  return resolveNativePlatform(window.__LILIA_NATIVE_PLATFORM__);
}

function configuredDefaultMode(nativePlatform: NativePlatform): BackdropMode {
  const configured = getLiliaAppConfig().appearance?.platformDefaults?.[nativePlatform]
    ?.backdropMode;
  return normalizeBackdropMode(
    isBackdropMode(configured) ? configured : DEFAULT_BACKDROP_BY_PLATFORM[nativePlatform],
    nativePlatform,
  );
}

function configuredDefaultOpacity(): number {
  return clampBackdropOpacity(
    getLiliaAppConfig().appearance?.backdropOpacity ?? BACKDROP_OPACITY_DEFAULT,
  );
}

function loadMode(nativePlatform: NativePlatform): BackdropMode {
  try {
    const stored = localStorage.getItem(modeStorageKey());
    return isBackdropMode(stored)
      ? normalizeBackdropMode(stored, nativePlatform)
      : configuredDefaultMode(nativePlatform);
  } catch {
    return configuredDefaultMode(nativePlatform);
  }
}

function loadOpacity(): number {
  try {
    const stored = localStorage.getItem(opacityStorageKey());
    if (stored !== null) return clampBackdropOpacity(Number.parseFloat(stored));
  } catch {
    // localStorage 不可用时使用应用默认值。
  }
  return configuredDefaultOpacity();
}

function applyDom(nativePlatform: NativePlatform, mode: BackdropMode, opacity: number) {
  document.documentElement.dataset.platform = nativePlatform;
  document.documentElement.dataset.backdrop = mode;
  document.documentElement.style.setProperty(
    "--lilia-backdrop-opacity",
    String(opacity),
  );
}

function persist(mode: BackdropMode, opacity: number) {
  try {
    localStorage.setItem(modeStorageKey(), mode);
    localStorage.setItem(opacityStorageKey(), String(opacity));
  } catch {
    // ignore
  }
}

async function flushNativeBackdrop() {
  if (nativeSyncInFlight) return;
  nativeSyncInFlight = true;
  try {
    while (pendingNativeState) {
      const request = pendingNativeState;
      pendingNativeState = null;
      try {
        await invoke("plugin:lilia|set_window_backdrop", request);
      } catch {
        // 浏览器预览或原生能力不可用时仍保留可用的实体 CSS 表面。
      }
    }
  } finally {
    nativeSyncInFlight = false;
  }
}

function scheduleNativeBackdrop(
  nativePlatform: NativePlatform,
  mode: BackdropMode,
  dark: boolean,
) {
  if (nativePlatform === "linux") return;
  pendingNativeState = { mode, dark };
  void flushNativeBackdrop();
}

function ensureNativeAppearance(): NativeAppearanceState {
  if (appearanceState) return appearanceState;

  const platform = readNativePlatform();
  const backdropMode = ref(loadMode(platform));
  const backdropOpacity = ref(loadOpacity());
  const { theme } = useTheme();

  appearanceState = { platform, backdropMode, backdropOpacity };

  watch(
    [backdropMode, backdropOpacity],
    ([mode, opacity]) => {
      applyDom(platform, mode, opacity);
      persist(mode, opacity);
    },
    { flush: "sync", immediate: true },
  );
  watch(
    backdropMode,
    (mode) => scheduleNativeBackdrop(platform, mode, theme.value === "dark"),
    { flush: "sync", immediate: true },
  );
  watch(
    theme,
    (nextTheme) => {
      if (platform === "windows" && backdropMode.value === "mica") {
        scheduleNativeBackdrop(platform, backdropMode.value, nextTheme === "dark");
      }
    },
    { flush: "sync" },
  );

  return appearanceState;
}

export function useNativeAppearance() {
  const state = ensureNativeAppearance();

  return {
    platform: state.platform,
    backdropMode: readonly(state.backdropMode),
    backdropOpacity: readonly(state.backdropOpacity),
    setBackdropMode(next: BackdropMode) {
      state.backdropMode.value = normalizeBackdropMode(next, state.platform);
    },
    setBackdropOpacity(next: number) {
      state.backdropOpacity.value = clampBackdropOpacity(next);
    },
  };
}
