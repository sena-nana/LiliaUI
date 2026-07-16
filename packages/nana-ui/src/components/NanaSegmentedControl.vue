<script setup lang="ts" generic="T extends string">
import type { TabsProps } from "@lilia/ui-contract";
import NanaTabs from "./NanaTabs.vue";
defineProps<TabsProps<T>>();
const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>
<template><NanaTabs class="nana-segmented" v-bind="$props" @update:model-value="emit('update:modelValue', $event)" /></template>
