<script setup lang="ts">
import type { ProgressProps } from "@lilia/ui-contract";
const props = withDefaults(defineProps<ProgressProps>(), { value: undefined, max: 100, cancellable: false });
const emit = defineEmits<{ cancel: [] }>();
const percent = () => props.value === undefined ? undefined : Math.max(0, Math.min(100, props.value / props.max * 100));
</script>
<template><div class="nana-progress" :data-agent-id="agentId"><div class="nana-progress__label"><span>{{ label }}</span><button v-if="cancellable" type="button" @click="emit('cancel')">取消</button></div><div class="nana-progress__track" role="progressbar" :aria-label="label" :aria-valuenow="value" :aria-valuemax="max"><span :class="{ 'is-indeterminate': value === undefined }" :style="percent() === undefined ? undefined : { width: `${percent()}%` }" /></div></div></template>
