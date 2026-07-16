import { inject, readonly, ref, type InjectionKey, type Ref } from "vue";
import type { UIPolicy } from "@lilia/ui-contract";
import { defaultNanaPolicy, resolveNanaPolicy } from "./policy";

export interface NanaUIContext {
  policy: Readonly<Ref<UIPolicy>>;
  setPolicy: (patch: Partial<UIPolicy>) => void;
  replacePolicy: (next?: Partial<UIPolicy>) => void;
}

export const nanaUIContextKey = Symbol.for("@lilia/nana-ui/context") as InjectionKey<NanaUIContext>;

export function createNanaUIContext(initial?: Partial<UIPolicy>): NanaUIContext {
  const policy = ref(resolveNanaPolicy(initial));
  return {
    policy: readonly(policy),
    setPolicy(patch) {
      policy.value = resolveNanaPolicy({ ...policy.value, ...patch });
    },
    replacePolicy(next) {
      policy.value = resolveNanaPolicy(next);
    },
  };
}

export function useNanaUI(): NanaUIContext {
  return inject(nanaUIContextKey, {
    policy: ref({ ...defaultNanaPolicy }),
    setPolicy() {},
    replacePolicy() {},
  });
}
