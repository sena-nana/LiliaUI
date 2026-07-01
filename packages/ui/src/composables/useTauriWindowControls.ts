import { onMounted, onUnmounted, ref } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";

type AppWindow = ReturnType<typeof getCurrentWindow>;

export interface TauriWindowControlOptions {
  trackMaximized?: boolean;
}

export function safeCurrentWindow(): AppWindow | null {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}

export function useTauriWindowControls(options: TauriWindowControlOptions = {}) {
  const appWindow = safeCurrentWindow();
  const isMaximized = ref(false);
  let unlistenResize: (() => void) | null = null;

  async function syncMaximized() {
    if (!appWindow) return;
    try {
      isMaximized.value = await appWindow.isMaximized();
    } catch {
      isMaximized.value = false;
    }
  }

  async function minimize() {
    if (!appWindow) return;
    await appWindow.minimize();
  }

  async function toggleMaximize() {
    if (!appWindow) return;
    await appWindow.toggleMaximize();
    await syncMaximized();
  }

  async function close() {
    if (!appWindow) return;
    await appWindow.close();
  }

  async function startDragging() {
    if (!appWindow || typeof appWindow.startDragging !== "function") return;
    try {
      await appWindow.startDragging();
    } catch {
      return;
    }
  }

  onMounted(async () => {
    if (!options.trackMaximized) return;
    await syncMaximized();
    if (!appWindow || typeof appWindow.onResized !== "function") return;
    try {
      unlistenResize = await appWindow.onResized(() => {
        void syncMaximized();
      });
    } catch {
      unlistenResize = null;
    }
  });

  onUnmounted(() => {
    unlistenResize?.();
    unlistenResize = null;
  });

  return {
    close,
    isMaximized,
    minimize,
    startDragging,
    toggleMaximize,
  };
}
