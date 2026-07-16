<script setup lang="ts">
import { ref } from "vue";
import NanaButton from "../components/NanaButton.vue";
const props = withDefaults(defineProps<{ title?: string; defaultOpen?: boolean; agentId?: string }>(), { title: "高级设置", defaultOpen: false });
const open = ref(props.defaultOpen);
</script>
<template><section class="nana-advanced" :data-agent-id="agentId"><NanaButton variant="text" :aria-expanded="open" @click="open = !open">{{ title }}</NanaButton><div v-if="open" class="nana-advanced__content"><slot /></div></section></template>
