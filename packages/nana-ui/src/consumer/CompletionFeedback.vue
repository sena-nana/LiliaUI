<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
const props = defineProps<{ trigger: string | number; label?: string; agentId?: string }>();
const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
watch(() => props.trigger, () => { visible.value = true; if (timer) clearTimeout(timer); timer = setTimeout(() => { visible.value = false; }, 500); });
onBeforeUnmount(() => { if (timer) clearTimeout(timer); });
</script>
<template><span v-if="visible" class="nana-completion" role="status" aria-live="polite" :data-agent-id="agentId"><span aria-hidden="true">✦</span>{{ label ?? '已完成' }}</span></template>
