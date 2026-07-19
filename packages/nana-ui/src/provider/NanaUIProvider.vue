<script setup lang="ts">
import { computed, provide, ref, watch } from "vue";
import type { UIDensity, UIPolicy } from "@lilia/ui-contract";
import {
  defaultNativeBackdrop,
  getNativeAppearanceAdapter,
  resolveNativePlatform,
  type NativeBackdropMode,
} from "@lilia/ui-foundation/native-appearance";
import { provideUIPolicy } from "@lilia/ui-foundation/policy";
import { useThemeState, type UITheme } from "@lilia/ui-foundation/theme";
import { createNanaUIContext, nanaUIContextKey } from "./context";

const props = withDefaults(defineProps<{
  policy?: Partial<UIPolicy>;
  theme?: UITheme;
  density?: UIDensity;
  storageKeyPrefix?: string;
  productTitle?: string;
  version?: string;
  agentId?: string;
}>(), {
  policy: undefined,
  theme: "system",
  density: undefined,
  storageKeyPrefix: "lilia",
  productTitle: "",
  version: "",
  agentId: undefined,
});

const platform = resolveNativePlatform();
const storedDensity = loadDensity();
const themeState = useThemeState({
  storageKey: `${props.storageKeyPrefix}.theme`,
  defaultTheme: props.theme,
});
const backdropMode = ref<NativeBackdropMode>(loadBackdropMode());
const resolvedTheme = computed(() => themeState.resolvedTheme.value);
const context = createNanaUIContext(
  {
    ...(storedDensity ? { density: storedDensity } : {}),
    ...props.policy,
    ...(props.density ? { density: props.density } : {}),
  },
  {
    theme: themeState.theme,
    resolvedTheme,
    backdropMode,
    platform,
    metadata: { productTitle: props.productTitle, version: props.version },
  },
);
provide(nanaUIContextKey, context);
provideUIPolicy(context);

watch(
  () => [props.policy, props.density] as const,
  ([policy, density]) => context.replacePolicy({ ...policy, ...(density ? { density } : {}) }),
  { deep: true },
);
watch(backdropMode, (mode) => {
  try { localStorage.setItem(`${props.storageKeyPrefix}.backdropMode`, mode); } catch { /* optional */ }
}, { immediate: true });
watch(() => context.policy.value.density, (density) => {
  try { localStorage.setItem(`${props.storageKeyPrefix}.density`, density); } catch { /* optional */ }
}, { immediate: true });
watch([backdropMode, resolvedTheme], ([mode, theme]) => {
  void getNativeAppearanceAdapter()?.setWindowBackdrop({ mode, dark: theme === "dark" });
}, { immediate: true });

function loadBackdropMode(): NativeBackdropMode {
  try {
    const stored = localStorage.getItem(`${props.storageKeyPrefix}.backdropMode`);
    if (stored === "acrylic" || stored === "mica" || stored === "solid" || stored === "system") return stored;
  } catch { /* optional */ }
  return defaultNativeBackdrop(platform);
}

function loadDensity(): UIDensity | undefined {
  try {
    const stored = localStorage.getItem(`${props.storageKeyPrefix}.density`);
    if (stored === "comfortable" || stored === "compact") return stored;
  } catch { /* optional */ }
  return undefined;
}
</script>

<template>
  <div
    class="nana-ui"
    :data-theme="resolvedTheme"
    :data-density="context.policy.value.density"
    :data-agent-id="agentId"
  >
    <slot />
  </div>
</template>
