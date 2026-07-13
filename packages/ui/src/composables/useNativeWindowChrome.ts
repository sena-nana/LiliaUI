import { onMounted, onUnmounted, readonly, shallowRef } from "vue";

export const WINDOW_CHROME_CHANGED_EVENT = "lilia:window-chrome-changed";

export type NativeWindowControls = "native-leading" | "native-trailing" | "custom";

export interface NativeWindowChromeInput {
  controls?: NativeWindowControls;
  leadingInset?: number;
  trailingInset?: number;
}

export interface NativeWindowChrome {
  controls: NativeWindowControls;
  leadingInset: number;
  trailingInset: number;
}

declare global {
  interface Window {
    __LILIA_WINDOW_CHROME__?: NativeWindowChromeInput;
  }
}

const DEFAULT_WINDOW_CHROME: NativeWindowChrome = {
  controls: "custom",
  leadingInset: 0,
  trailingInset: 0,
};

function normalizeInset(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function resolveNativeWindowChrome(
  input: NativeWindowChromeInput | undefined,
): NativeWindowChrome {
  const controls =
    input?.controls === "native-leading" ||
    input?.controls === "native-trailing" ||
    input?.controls === "custom"
      ? input.controls
      : DEFAULT_WINDOW_CHROME.controls;

  return {
    controls,
    leadingInset: normalizeInset(input?.leadingInset),
    trailingInset: normalizeInset(input?.trailingInset),
  };
}

function readWindowChrome(): NativeWindowChrome {
  if (typeof window === "undefined") return { ...DEFAULT_WINDOW_CHROME };
  return resolveNativeWindowChrome(window.__LILIA_WINDOW_CHROME__);
}

export function useNativeWindowChrome() {
  const chrome = shallowRef(readWindowChrome());

  function onChromeChanged(event: Event) {
    chrome.value = resolveNativeWindowChrome(
      (event as CustomEvent<NativeWindowChromeInput>).detail,
    );
  }

  onMounted(() => {
    window.addEventListener(WINDOW_CHROME_CHANGED_EVENT, onChromeChanged);
    chrome.value = readWindowChrome();
  });

  onUnmounted(() => {
    window.removeEventListener(WINDOW_CHROME_CHANGED_EVENT, onChromeChanged);
  });

  return {
    chrome: readonly(chrome),
  };
}
