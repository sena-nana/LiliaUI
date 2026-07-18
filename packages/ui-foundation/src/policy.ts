import {
  inject,
  provide,
  readonly,
  ref,
  type App,
  type InjectionKey,
  type Ref,
} from "vue";
import type { UIPolicy, UIProviderValue } from "@lilia/ui-contract";

export interface UIPolicyContext extends UIProviderValue<Readonly<Ref<UIPolicy>>> {}

export const uiPolicyKey = Symbol.for("@lilia/ui-foundation/policy") as InjectionKey<UIPolicyContext>;

export function createUIPolicyContext(
  defaults: Readonly<UIPolicy>,
  initial?: Partial<UIPolicy>,
): UIPolicyContext {
  const defaultPolicy = { ...defaults };
  const policy = ref<UIPolicy>({ ...defaultPolicy, ...initial });
  return {
    policy: readonly(policy),
    setPolicy(patch) {
      policy.value = { ...policy.value, ...patch };
    },
    replacePolicy(next) {
      policy.value = { ...defaultPolicy, ...next };
    },
    resetPolicy() {
      policy.value = { ...defaultPolicy };
    },
  };
}

export function createUIPolicyFallback(defaults: Readonly<UIPolicy>): UIPolicyContext {
  const policy = readonly(ref<UIPolicy>({ ...defaults }));
  return {
    policy,
    setPolicy() {},
    replacePolicy() {},
    resetPolicy() {},
  };
}

export function provideUIPolicy(context: UIPolicyContext): UIPolicyContext {
  provide(uiPolicyKey, context);
  return context;
}

export function installUIPolicy(app: App, context: UIPolicyContext): UIPolicyContext {
  app.provide(uiPolicyKey, context);
  return context;
}

export function useUIPolicy(): UIPolicyContext | null {
  return inject(uiPolicyKey, null);
}
