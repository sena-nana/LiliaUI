<script setup lang="ts">
import NanaButton from "../components/NanaButton.vue";
withDefaults(defineProps<{ title: string; currentStep: number; totalSteps: number; canContinue?: boolean; canSkip?: boolean; agentId?: string }>(), { canContinue: true, canSkip: true });
const emit = defineEmits<{ continue: []; skip: []; back: [] }>();
</script>
<template><section class="nana-onboarding" :data-agent-id="agentId"><header><span>步骤 {{ currentStep }} / {{ totalSteps }}</span><h1>{{ title }}</h1></header><main><slot /></main><footer><NanaButton v-if="currentStep > 1" @click="emit('back')">上一步</NanaButton><NanaButton v-if="canSkip" variant="text" @click="emit('skip')">稍后继续</NanaButton><NanaButton variant="primary" :disabled="!canContinue" @click="emit('continue')">继续</NanaButton></footer></section></template>
