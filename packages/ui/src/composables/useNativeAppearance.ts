import { invoke } from "@tauri-apps/api/core";
import { readonly, ref, watch, type Ref } from "vue";
import {
  APP_METADATA,
  getLiliaUiConfig,
  type BackdropMode,
  type BackdropTarget,
  type NativePlatform,
} from "../config/appShell";
import { useTheme } from "./useTheme";

export interface NativeAppearanceSettings {
  backdropMode: BackdropMode;
  backdropOpacity: number;
  backdropTarget: BackdropTarget;
  titlebarFollowsSidebar: boolean;
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
  backdropTarget: Ref<BackdropTarget>;
  titlebarFollowsSidebar: Ref<boolean>;
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

function targetStorageKey() {
  return `${APP_METADATA.storageKeyPrefix}.backdropTarget`;
}

function titlebarFollowsSidebarStorageKey() {
  return `${APP_METADATA.storageKeyPrefix}.titlebarFollowsSidebar`;
}

function isBackdropMode(value: unknown): value is BackdropMode {
  return value === "system" || value === "mica" || value === "acrylic" || value === "solid";
}

function isBackdropTarget(value: unknown): value is BackdropTarget {
  return value === "sidebar" || value === "main";
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

export function readNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "linux";
  return resolveNativePlatform(window.__LILIA_NATIVE_PLATFORM__);
}

function configuredDefaultMode(nativePlatform: NativePlatform): BackdropMode {
  const configured = getLiliaUiConfig().appearance?.platformDefaults?.[nativePlatform]
    ?.backdropMode;
  return normalizeBackdropMode(
    isBackdropMode(configured) ? configured : DEFAULT_BACKDROP_BY_PLATFORM[nativePlatform],
    nativePlatform,
  );
}

function configuredDefaultOpacity(): number {
  return clampBackdropOpacity(
    getLiliaUiConfig().appearance?.backdropOpacity ?? BACKDROP_OPACITY_DEFAULT,
  );
}

function configuredDefaultTarget(): BackdropTarget {
  const configured = getLiliaUiConfig().appearance?.backdropTarget;
  return isBackdropTarget(configured) ? configured : "sidebar";
}

function configuredTitlebarFollowsSidebar(): boolean {
  const configured = getLiliaUiConfig().appearance?.titlebarFollowsSidebar;
  return typeof configured === "boolean" ? configured : true;
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

function loadTarget(): BackdropTarget {
  try {
    const stored = localStorage.getItem(targetStorageKey());
    return isBackdropTarget(stored) ? stored : configuredDefaultTarget();
  } catch {
    return configuredDefaultTarget();
  }
}

function loadTitlebarFollowsSidebar(): boolean {
  try {
    const stored = localStorage.getItem(titlebarFollowsSidebarStorageKey());
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // localStorage 不可用时使用应用默认值。
  }
  return configuredTitlebarFollowsSidebar();
}

function applyDom(
  nativePlatform: NativePlatform,
  mode: BackdropMode,
  opacity: number,
  target: BackdropTarget,
  titlebarFollowsSidebar: boolean,
) {
  document.documentElement.dataset.platform = nativePlatform;
  document.documentElement.dataset.backdrop = mode;
  document.documentElement.dataset.backdropTarget = target;
  document.documentElement.dataset.titlebarFollowsSidebar = String(titlebarFollowsSidebar);
  document.documentElement.style.setProperty(
    "--lilia-backdrop-opacity",
    String(opacity),
  );
}

function persist(
  mode: BackdropMode,
  opacity: number,
  target: BackdropTarget,
  titlebarFollowsSidebar: boolean,
) {
  try {
    localStorage.setItem(modeStorageKey(), mode);
    localStorage.setItem(opacityStorageKey(), String(opacity));
    localStorage.setItem(targetStorageKey(), target);
    localStorage.setItem(
      titlebarFollowsSidebarStorageKey(),
      String(titlebarFollowsSidebar),
    );
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
  const backdropTarget = ref(loadTarget());
  const titlebarFollowsSidebar = ref(loadTitlebarFollowsSidebar());
  const { theme } = useTheme();

  appearanceState = {
    platform,
    backdropMode,
    backdropOpacity,
    backdropTarget,
    titlebarFollowsSidebar,
  };

  watch(
    [backdropMode, backdropOpacity, backdropTarget, titlebarFollowsSidebar],
    ([mode, opacity, target, followsSidebar]) => {
      applyDom(platform, mode, opacity, target, followsSidebar);
      persist(mode, opacity, target, followsSidebar);
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
    backdropTarget: readonly(state.backdropTarget),
    titlebarFollowsSidebar: readonly(state.titlebarFollowsSidebar),
    setBackdropMode(next: BackdropMode) {
      state.backdropMode.value = normalizeBackdropMode(next, state.platform);
    },
    setBackdropOpacity(next: number) {
      state.backdropOpacity.value = clampBackdropOpacity(next);
    },
    setBackdropTarget(next: BackdropTarget) {
      state.backdropTarget.value = next;
    },
    setTitlebarFollowsSidebar(next: boolean) {
      state.titlebarFollowsSidebar.value = next;
    },
  };
}
