import { ref, watch, type Ref } from "vue";

export type UITheme = "light" | "dark" | "system";

export interface ThemeSyncOptions {
  storageKey: string;
  defaultTheme?: UITheme;
  target?: HTMLElement;
}

export function useThemeSync(options: ThemeSyncOptions): Ref<UITheme> {
  const theme = ref<UITheme>(readTheme(options.storageKey, options.defaultTheme ?? "system"));
  const apply = (next: UITheme) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const target = options.target ?? document.documentElement;
    const resolved = next === "system"
      ? (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : next;
    target.dataset.theme = resolved;
    try {
      localStorage.setItem(options.storageKey, next);
    } catch {
      // Storage is optional; DOM state remains authoritative for this session.
    }
  };
  watch(theme, apply, { immediate: true });
  return theme;
}

function readTheme(key: string, fallback: UITheme): UITheme {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // Ignore unavailable storage.
  }
  return fallback;
}
