<script setup lang="ts">
import type { ProgressEmits, ProgressProps } from "@lilia/ui-contract";
const props = withDefaults(defineProps<ProgressProps>(), { value: undefined, max: 100, cancellable: false });
const emit = defineEmits<ProgressEmits>();
const safeMax = () => Math.max(props.max, 1);
const boundedValue = () => props.value === undefined ? undefined : Math.max(0, Math.min(safeMax(), props.value));
const percent = () => boundedValue() === undefined ? undefined : boundedValue()! / safeMax() * 100;
</script>
<template><div class="nana-progress" :data-agent-id="agentId"><div class="nana-progress__label"><span>{{ label }}</span><button v-if="cancellable" type="button" aria-label="取消" @click="emit('cancel')">取消</button></div><div class="nana-progress__track" role="progressbar" :aria-label="label" :aria-valuenow="boundedValue()" :aria-valuemax="safeMax()"><span :class="{ 'is-indeterminate': value === undefined }" :style="percent() === undefined ? undefined : { width: `${percent()}%` }" /></div></div></template>
