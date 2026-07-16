<script setup lang="ts">
import { computed } from "vue";
import { useNanaUI } from "../provider/context";
const props = withDefaults(defineProps<{ level?: "essential" | "optional" | "advanced"; title?: string; agentId?: string }>(), { level: "essential" });
const ui = useNanaUI();
const visible = computed(() => props.level !== "advanced" || ui.policy.value.advancedDisclosure === "visible");
</script>
<template><section v-if="visible" class="nana-progressive" :data-level="level" :data-agent-id="agentId"><h2 v-if="title">{{ title }}</h2><slot /></section></template>
