<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { ToastEmits, ToastProps } from "@lilia/ui-contract";
import NanaIconButton from "./NanaIconButton.vue";
withDefaults(defineProps<ToastProps>(), { tone: "neutral", dismissible: true });
const emit = defineEmits<ToastEmits>();
</script>
<template><aside class="nana-toast" :class="`nana-toast--${tone}`" :role="tone === 'error' || tone === 'warning' ? 'alert' : 'status'" aria-live="polite" :data-agent-id="agentId"><div><strong>{{ title }}</strong><p v-if="description">{{ description }}</p><slot /></div><NanaIconButton v-if="dismissible" :icon="X" label="关闭通知" @click="emit('dismiss')" /></aside></template>
