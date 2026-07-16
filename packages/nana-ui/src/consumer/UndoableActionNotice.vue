<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import NanaButton from "../components/NanaButton.vue";
const props = withDefaults(defineProps<{ message: string; timeoutMs?: number; agentId?: string }>(), { timeoutMs: 5000 });
const emit = defineEmits<{ undo: []; expired: [] }>();
const active = ref(true);
const timer = setTimeout(() => { active.value = false; emit("expired"); }, props.timeoutMs);
onBeforeUnmount(() => clearTimeout(timer));
function undo() { if (!active.value) return; active.value = false; clearTimeout(timer); emit("undo"); }
</script>
<template><aside v-if="active" class="nana-undo" role="status" aria-live="assertive" :data-agent-id="agentId"><span>{{ message }}</span><NanaButton variant="text" @click="undo">撤销</NanaButton></aside></template>
