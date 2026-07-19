import {
  computed,
  inject,
  readonly,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from "vue";
import type { UIDensity, UIPolicy } from "@lilia/ui-contract";
import {
  createUIPolicyContext,
  type UIPolicyContext,
} from "@lilia/ui-foundation/policy";
import {
  defaultNativeBackdrop,
  resolveNativePlatform,
  type NativeBackdropMode,
  type NativePlatform,
} from "@lilia/ui-foundation/native-appearance";
import type { ResolvedUITheme, UITheme } from "@lilia/ui-foundation/theme";
import { defaultNanaPolicy } from "../policy";

export interface NanaUIContext extends UIPolicyContext {
  theme: Readonly<Ref<UITheme>>;
  resolvedTheme: Readonly<Ref<ResolvedUITheme>>;
  backdropMode: Readonly<Ref<NativeBackdropMode>>;
  platform: NativePlatform;
  metadata: Readonly<{ productTitle: string; version: string }>;
  setTheme: (theme: UITheme) => void;
  setDensity: (density: UIDensity) => void;
  setBackdropMode: (mode: NativeBackdropMode) => void;
}

export interface NanaUIContextOptions {
  theme?: Ref<UITheme>;
  resolvedTheme?: Ref<ResolvedUITheme> | ComputedRef<ResolvedUITheme>;
  backdropMode?: Ref<NativeBackdropMode>;
  platform?: NativePlatform;
  metadata?: { productTitle?: string; version?: string };
}

export const nanaUIContextKey = Symbol.for("@lilia/nana-ui/provider") as InjectionKey<NanaUIContext>;

export function createNanaUIContext(
  initial?: Partial<UIPolicy>,
  options: NanaUIContextOptions = {},
): NanaUIContext {
  const policyContext = createUIPolicyContext(defaultNanaPolicy, initial);
  const theme = options.theme ?? ref<UITheme>("system");
  const resolvedTheme = options.resolvedTheme ?? computed<ResolvedUITheme>(() => theme.value === "light" ? "light" : "dark");
  const platform = options.platform ?? resolveNativePlatform();
  const backdropMode = options.backdropMode ?? ref<NativeBackdropMode>(defaultNativeBackdrop(platform));
  return {
    ...policyContext,
    theme: readonly(theme),
    resolvedTheme: readonly(resolvedTheme),
    backdropMode: readonly(backdropMode),
    platform,
    metadata: Object.freeze({
      productTitle: options.metadata?.productTitle ?? "",
      version: options.metadata?.version ?? "",
    }),
    setTheme(next) { theme.value = next; },
    setDensity(density) { policyContext.setPolicy({ density }); },
    setBackdropMode(mode) { backdropMode.value = mode; },
  };
}

const fallbackContext = createNanaUIContext();

export function useNanaUI(): NanaUIContext {
  return inject(nanaUIContextKey, fallbackContext);
}
