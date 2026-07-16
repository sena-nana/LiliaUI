<script setup lang="ts">
import TaskPageHeader from "./TaskPageHeader.vue";
defineProps<{ title: string; description?: string; agentId?: string }>();
</script>
<template><section class="nana-pattern nana-home" :data-agent-id="agentId"><TaskPageHeader :title="title" :description="description"><template #status><slot name="status" /></template><template #actions><slot name="primary-action" /></template></TaskPageHeader><div class="nana-home__grid"><div class="nana-home__recent"><slot name="recent" /></div><div class="nana-home__device"><slot name="device" /></div><div class="nana-home__next"><slot name="next-step" /></div><div class="nana-home__history"><slot name="history" /></div></div></section></template>
