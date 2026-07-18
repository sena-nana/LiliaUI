import { invoke } from "@tauri-apps/api/core";
import {
  setNativeAppearanceAdapter,
  type NativeAppearanceAdapter,
} from "./nativeAppearanceAdapter";

export function createTauriNativeAppearanceAdapter(): NativeAppearanceAdapter {
  return {
    setWindowBackdrop(request) {
      return invoke("plugin:lilia|set_window_backdrop", { ...request });
    },
  };
}

export function installTauriNativeAppearanceAdapter(): () => void {
  return setNativeAppearanceAdapter(createTauriNativeAppearanceAdapter());
}
