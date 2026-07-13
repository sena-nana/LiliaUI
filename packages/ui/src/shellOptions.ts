import type { Component, ComputedRef, InjectionKey, Ref } from "vue";

export type LiliaShellSetupOverlaySource =
  | Ref<boolean>
  | ComputedRef<boolean>
  | (() => boolean);

export interface LiliaShellOptions {
  mainSidebar?: Component;
  setupOverlayActive?: LiliaShellSetupOverlaySource;
}

export const liliaShellOptionsKey: InjectionKey<LiliaShellOptions> = Symbol("liliaShellOptions");

export function resolveShellBoolean(source: LiliaShellSetupOverlaySource | undefined): boolean {
  if (!source) return false;
  if (typeof source === "function") return source();
  return source.value;
}
