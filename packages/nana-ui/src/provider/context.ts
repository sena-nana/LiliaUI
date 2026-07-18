import { inject, readonly, ref, type InjectionKey, type Ref } from "vue";
import type { UIDensity, UIPolicy } from "@lilia/ui-contract";
import type { NativeBackdropMode, NativePlatform } from "@lilia/ui-foundation/native-appearance";
import type { ResolvedUITheme, UITheme } from "@lilia/ui-foundation/theme";
import { resolveNanaPolicy } from "./policy";

export interface NanaUIContext {
  policy: Readonly<Ref<UIPolicy>>;
  theme: Readonly<Ref<UITheme>>;
  resolvedTheme: Readonly<Ref<ResolvedUITheme>>;
  backdropMode: Readonly<Ref<NativeBackdropMode>>;
  platform: NativePlatform;
  metadata: Readonly<{ productTitle: string; version: string }>;
  setPolicy: (patch: Partial<UIPolicy>) => void;
  setTheme: (theme: UITheme) => void;
  setDensity: (density: UIDensity) => void;
  setBackdropMode: (mode: NativeBackdropMode) => void;
  replacePolicy: (next?: Partial<UIPolicy>) => void;
}

export const nanaUIContextKey = Symbol.for("@lilia/nana-ui/context") as InjectionKey<NanaUIContext>;

export interface NanaUIContextOptions {
  theme: Ref<UITheme>;
  resolvedTheme: Ref<ResolvedUITheme>;
  backdropMode: Ref<NativeBackdropMode>;
  platform: NativePlatform;
  metadata?: { productTitle?: string; version?: string };
}

export function createNanaUIContext(initial: Partial<UIPolicy> | undefined, options: NanaUIContextOptions): NanaUIContext {
  const policy = ref(resolveNanaPolicy(initial));
  return {
    policy: readonly(policy),
    theme: readonly(options.theme),
    resolvedTheme: readonly(options.resolvedTheme),
    backdropMode: readonly(options.backdropMode),
    platform: options.platform,
    metadata: Object.freeze({
      productTitle: options.metadata?.productTitle ?? "",
      version: options.metadata?.version ?? "",
    }),
    setPolicy(patch) {
      policy.value = resolveNanaPolicy({ ...policy.value, ...patch });
    },
    replacePolicy(next) {
      policy.value = resolveNanaPolicy(next);
    },
    setTheme(next) { options.theme.value = next; },
    setDensity(density) { policy.value = resolveNanaPolicy({ ...policy.value, density }); },
    setBackdropMode(mode) { options.backdropMode.value = mode; },
  };
}

export function useNanaUI(): NanaUIContext {
  const context = inject(nanaUIContextKey, null);
  if (!context) throw new Error("useNanaUI() requires NanaUIProvider.");
  return context;
}
