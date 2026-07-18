import type { BackdropMode } from "../config/appShell";

export interface NativeBackdropRequest {
  mode: BackdropMode;
  dark: boolean;
}

export interface NativeAppearanceAdapter {
  setWindowBackdrop: (request: NativeBackdropRequest) => void | Promise<void>;
}

let adapter: NativeAppearanceAdapter | null = null;

export function getNativeAppearanceAdapter(): NativeAppearanceAdapter | null {
  return adapter;
}

export function setNativeAppearanceAdapter(next: NativeAppearanceAdapter | null): () => void {
  adapter = next;
  return () => {
    if (adapter === next) adapter = null;
  };
}
