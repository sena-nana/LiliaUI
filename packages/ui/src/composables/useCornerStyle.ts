import { ref, watch, type Ref } from "vue";
import { APP_METADATA, type NativePlatform } from "../config/appShell";
import { readNativePlatform } from "./useNativeAppearance";

export type CornerStyle = "smooth" | "round";

export const DEFAULT_CORNER_RADIUS = 16;
const MACOS_DEFAULT_CORNER_RADIUS = 8;
const DEFAULT_CORNER_PREFERENCES = {
  macos: { style: "round", radius: MACOS_DEFAULT_CORNER_RADIUS },
  windows: { style: "smooth", radius: DEFAULT_CORNER_RADIUS },
  linux: { style: "smooth", radius: DEFAULT_CORNER_RADIUS },
} as const satisfies Record<NativePlatform, { style: CornerStyle; radius: number }>;
export const CORNER_RADIUS_MIN = 0;
export const CORNER_RADIUS_MAX = 20;
let cornerStyle: Ref<CornerStyle> | null = null;
let cornerRadius: Ref<number> | null = null;

function storageKey() {
  return `${APP_METADATA.storageKeyPrefix}.corners`;
}

function radiusStorageKey() {
  return `${APP_METADATA.storageKeyPrefix}.cornerRadius`;
}

function defaultCornerPreferences() {
  return DEFAULT_CORNER_PREFERENCES[readNativePlatform()];
}

function loadInitial(): CornerStyle {
  try {
    const stored = localStorage.getItem(storageKey());
    if (stored === "smooth" || stored === "round") return stored;
  } catch {
    // localStorage 不可用时回到默认圆角。
  }
  return defaultCornerPreferences().style;
}

function clampRadius(value: number): number {
  return Math.min(CORNER_RADIUS_MAX, Math.max(CORNER_RADIUS_MIN, value));
}

function loadInitialRadius(): number {
  try {
    const stored = localStorage.getItem(radiusStorageKey());
    const parsed = stored === null ? NaN : Number.parseFloat(stored);
    if (Number.isFinite(parsed)) return clampRadius(parsed);
  } catch {
    // localStorage 不可用时回到默认半径。
  }
  return defaultCornerPreferences().radius;
}

function applyCornerPreferences(style: CornerStyle, radius: number): void {
  const clampedRadius = clampRadius(radius);
  document.documentElement.dataset.corners = style;
  document.documentElement.style.setProperty("--app-corner-radius", `${clampedRadius}px`);
  try {
    localStorage.setItem(storageKey(), style);
    localStorage.setItem(radiusStorageKey(), String(clampedRadius));
  } catch {
    // ignore
  }
}

function ensureCornerState() {
  if (cornerStyle && cornerRadius) return { cornerStyle, cornerRadius };
  cornerStyle = ref<CornerStyle>(loadInitial());
  cornerRadius = ref(loadInitialRadius());
  watch(
    [cornerStyle, cornerRadius],
    ([style, radius]) => applyCornerPreferences(style, radius),
    { flush: "sync", immediate: true },
  );
  return { cornerStyle, cornerRadius };
}

export function useCornerStyle() {
  const state = ensureCornerState();

  return {
    cornerStyle: state.cornerStyle,
    cornerRadius: state.cornerRadius,
    setCornerStyle(next: CornerStyle) {
      state.cornerStyle.value = next;
    },
    setCornerRadius(next: number) {
      state.cornerRadius.value = clampRadius(next);
    },
  };
}
