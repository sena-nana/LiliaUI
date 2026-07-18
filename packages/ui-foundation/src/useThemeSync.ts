import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from "vue";

export type UITheme = "light" | "dark" | "system";
export type ResolvedUITheme = "light" | "dark";

export interface ThemeSyncOptions {
  storageKey: string;
  defaultTheme?: UITheme;
  target?: HTMLElement;
}

export interface ThemeSyncState {
  theme: Ref<UITheme>;
  resolvedTheme: ComputedRef<ResolvedUITheme>;
  setTheme: (theme: UITheme) => void;
}

export function useThemeSync(options: ThemeSyncOptions): Ref<UITheme> {
  return useThemeState(options).theme;
}

export function useThemeState(options: ThemeSyncOptions): ThemeSyncState {
  const theme = ref<UITheme>(readTheme(options.storageKey, options.defaultTheme ?? "system"));
  const systemTheme = ref<ResolvedUITheme>(preferredSystemTheme());
  const resolvedTheme = computed(() => theme.value === "system" ? systemTheme.value : theme.value);
  const media = typeof window === "undefined" ? null : window.matchMedia?.("(prefers-color-scheme: light)");
  const syncSystemTheme = () => { systemTheme.value = media?.matches ? "light" : "dark"; };
  const apply = (next: UITheme) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const target = options.target ?? document.documentElement;
    const resolved = next === "system" ? systemTheme.value : next;
    target.dataset.theme = resolved;
    try {
      localStorage.setItem(options.storageKey, next);
    } catch {
      // Storage is optional; DOM state remains authoritative for this session.
    }
  };
  watch(theme, apply, { immediate: true });
  watch(systemTheme, () => {
    if (theme.value === "system") apply(theme.value);
  });
  onMounted(() => media?.addEventListener?.("change", syncSystemTheme));
  onUnmounted(() => media?.removeEventListener?.("change", syncSystemTheme));
  return {
    theme,
    resolvedTheme,
    setTheme(next) { theme.value = next; },
  };
}

function preferredSystemTheme(): ResolvedUITheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
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
