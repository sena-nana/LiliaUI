import type { Component, InjectionKey } from "vue";

export interface LiliaShellOptions {
  titlebarActions?: Component;
}

export const liliaShellOptionsKey: InjectionKey<LiliaShellOptions> = Symbol("liliaShellOptions");
