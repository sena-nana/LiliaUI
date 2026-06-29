import { ref, watch, type Ref } from "vue";
import { APP_METADATA } from "../config/appShell";

export type Theme = "dark" | "light";

const DEFAULT_THEME: Theme = "dark";
let theme: Ref<Theme> | null = null;

function storageKey() {
  return `${APP_METADATA.storageKeyPrefix}.theme`;
}

function loadInitial(): Theme {
  try {
    const stored = localStorage.getItem(storageKey());
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage 不可用时回到默认主题。
  }
  return DEFAULT_THEME;
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

function persist(next: Theme): void {
  apply(next);
  try {
    localStorage.setItem(storageKey(), next);
  } catch {
    // ignore
  }
}

function ensureTheme() {
  if (theme) return theme;
  theme = ref<Theme>(loadInitial());
  apply(theme.value);
  watch(theme, persist);
  return theme;
}

export function useTheme() {
  const currentTheme = ensureTheme();
  return {
    theme: currentTheme,
    setTheme(next: Theme) {
      currentTheme.value = next;
      persist(next);
    },
    toggleTheme() {
      const next = currentTheme.value === "dark" ? "light" : "dark";
      currentTheme.value = next;
      persist(next);
    },
  };
}
