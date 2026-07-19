export type NativeBackdropMode = "acrylic" | "mica" | "solid" | "system";
export type NativePlatform = "linux" | "macos" | "windows";

export interface NativeBackdropRequest {
  mode: NativeBackdropMode;
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

export function resolveNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "linux";
  const value = (window as Window & { __LILIA_NATIVE_PLATFORM__?: NativePlatform })
    .__LILIA_NATIVE_PLATFORM__;
  return value === "windows" || value === "macos" || value === "linux" ? value : "linux";
}

export function defaultNativeBackdrop(platform = resolveNativePlatform()): NativeBackdropMode {
  if (platform === "windows") return "mica";
  if (platform === "macos") return "system";
  return "solid";
}
