<script setup lang="ts">
import { provideUIPolicy } from "@lilia/ui-foundation/policy";
import type { UIPolicy } from "@lilia/ui-contract";
import { watch } from "vue";
import { createLiliaUIContext } from "./context";

const props = withDefaults(defineProps<{
  policy?: Partial<UIPolicy>;
  theme?: "light" | "dark";
  agentId?: string;
}>(), {
  policy: undefined,
  theme: "light",
  agentId: undefined,
});

const context = createLiliaUIContext(props.policy);
provideUIPolicy(context);
watch(
  () => props.policy,
  (policy) => context.replacePolicy(policy),
  { deep: true },
);
</script>

<template>
  <div
    class="lilia-ui"
    :data-theme="theme"
    :data-density="context.policy.value.density"
    :data-agent-id="agentId"
  >
    <slot />
  </div>
</template>

<style scoped>
.lilia-ui { min-width: 0; min-height: 100%; color: var(--text); background: var(--bg); }
</style>
