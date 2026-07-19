import {
  createUIPolicyContext,
  createUIPolicyFallback,
  useUIPolicy,
  type UIPolicyContext,
} from "@lilia/ui-foundation/policy";
import type { UIPolicy } from "@lilia/ui-contract";
import { defaultLiliaPolicy } from "../preset-definition";

export type LiliaUIContext = UIPolicyContext;

const fallbackContext = createUIPolicyFallback(defaultLiliaPolicy);

export function createLiliaUIContext(initial?: Partial<UIPolicy>): LiliaUIContext {
  return createUIPolicyContext(defaultLiliaPolicy, initial);
}

export function useLiliaUI(): LiliaUIContext {
  return useUIPolicy() ?? fallbackContext;
}
