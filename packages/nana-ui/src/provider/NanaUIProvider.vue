<script setup lang="ts">
import { provide, watch } from "vue";
import type { UIPolicy } from "@lilia/ui-contract";
import { createNanaUIContext, nanaUIContextKey } from "./context";

const props = withDefaults(defineProps<{
  policy?: Partial<UIPolicy>;
  theme?: "light" | "dark";
  agentId?: string;
}>(), {
  policy: undefined,
  theme: "light",
  agentId: undefined,
});

const context = createNanaUIContext(props.policy);
provide(nanaUIContextKey, context);
watch(
  () => props.policy,
  (policy) => context.replacePolicy(policy),
  { deep: true },
);
</script>

<template>
  <div
    class="nana-ui"
    :data-theme="theme"
    :data-density="context.policy.value.density"
    :data-agent-id="agentId"
  >
    <slot />
  </div>
</template>
