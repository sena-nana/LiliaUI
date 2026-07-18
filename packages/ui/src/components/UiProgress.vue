<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { ProgressEmits, ProgressProps } from "@lilia/ui-contract";
import { computed } from "vue";

const props = withDefaults(defineProps<ProgressProps>(), {
  value: undefined,
  max: 100,
  cancellable: false,
  agentId: undefined,
});
defineEmits<ProgressEmits>();
const safeMax = computed(() => Math.max(props.max, 1));
const boundedValue = computed(() => props.value === undefined
  ? undefined
  : Math.min(Math.max(props.value, 0), safeMax.value));
const percentage = computed(() => boundedValue.value === undefined
  ? undefined
  : Math.round((boundedValue.value / safeMax.value) * 100));
</script>

<template>
  <div class="ui-progress" :data-agent-id="agentId">
    <div class="ui-progress__header">
      <span>{{ label }}</span>
      <span v-if="percentage !== undefined" class="ui-progress__value">{{ percentage }}%</span>
      <button v-if="cancellable" class="ui-progress__cancel" type="button" aria-label="取消" @click="$emit('cancel')">
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
    <progress :value="boundedValue" :max="safeMax" :aria-label="label" :aria-valuenow="boundedValue">{{ percentage }}%</progress>
  </div>
</template>

<style scoped>
.ui-progress { display: grid; min-width: 0; gap: 6px; }
.ui-progress__header { display: flex; min-width: 0; align-items: center; gap: 8px; color: var(--text); font-size: 12px; }
.ui-progress__header > span:first-child { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-progress__value { color: var(--text-muted); font-variant-numeric: tabular-nums; }
.ui-progress__cancel { display: inline-grid; width: 24px; height: 24px; place-items: center; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); cursor: pointer; }
.ui-progress__cancel:hover { background: var(--bg-hover); color: var(--text); }
.ui-progress progress { width: 100%; height: 6px; overflow: hidden; border: 0; border-radius: var(--radius-pill); background: var(--bg-subtle); accent-color: var(--accent); }
.ui-progress progress::-webkit-progress-bar { background: var(--bg-subtle); }
.ui-progress progress::-webkit-progress-value { background: var(--accent); }
.ui-progress progress:indeterminate { animation: ui-progress-pulse 1.2s ease-in-out infinite; }
@keyframes ui-progress-pulse { 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) { .ui-progress progress:indeterminate { animation: none; } }
</style>
