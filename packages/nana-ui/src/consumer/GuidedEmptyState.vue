<script setup lang="ts">
import type { EmptyStateProps } from "@lilia/ui-contract";
import NanaEmptyState from "../components/NanaEmptyState.vue";
defineProps<EmptyStateProps & { nextStep?: string }>();
</script>
<template><NanaEmptyState v-bind="$props"><template #icon><slot name="icon" /></template><template #actions><slot name="actions" /><p v-if="nextStep" class="nana-guided-next">{{ nextStep }}</p></template></NanaEmptyState></template>
