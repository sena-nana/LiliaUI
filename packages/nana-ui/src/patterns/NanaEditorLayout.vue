<script setup lang="ts">
defineProps<{ contextVisible?: boolean; statusVisible?: boolean; agentId?: string }>();
</script>
<template><section class="nana-editor" :class="{ 'has-context': contextVisible, 'has-status': statusVisible }" :data-agent-id="agentId"><header class="nana-editor__top"><slot name="top" /></header><aside class="nana-editor__objects"><slot name="objects" /></aside><main class="nana-editor__preview"><slot name="preview" /></main><aside v-if="contextVisible" class="nana-editor__context"><slot name="context" /></aside><footer v-if="statusVisible" class="nana-editor__status"><slot name="status" /></footer></section></template>
