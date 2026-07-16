<script setup lang="ts">
import type { RecoveryErrorModel } from "@lilia/ui-contract";
import NanaButton from "../components/NanaButton.vue";
withDefaults(defineProps<{ model: RecoveryErrorModel; presentation?: "inline" | "page" | "dialog"; agentId?: string }>(), { presentation: "inline" });
</script>
<template><section class="nana-recovery" :class="`nana-recovery--${presentation}`" role="alert" :data-agent-id="agentId"><h2>{{ model.title }}</h2><p>{{ model.impact }}</p><div class="nana-recovery__actions"><NanaButton v-for="(action, index) in model.actions" :key="action.id" :variant="index === 0 ? 'primary' : 'secondary'" :agent-id="`${agentId ?? 'recovery'}.${action.id}`" @click="action.run">{{ action.label }}</NanaButton></div></section></template>
