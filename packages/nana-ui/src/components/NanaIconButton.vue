<script setup lang="ts">
import type { Component } from "vue";
import type { IconButtonProps } from "@lilia/ui-contract";
import NanaButton from "./NanaButton.vue";
import NanaTooltip from "./NanaTooltip.vue";

const props = defineProps<IconButtonProps & { icon: Component }>();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <NanaTooltip :text="tooltip ?? label">
    <NanaButton
      class="nana-icon-button"
      :class="{ 'is-active': active }"
      :variant="variant"
      :size="size"
      :disabled="disabled"
      :loading="loading"
      :agent-id="agentId"
      :aria-label="label"
      @click="emit('click', $event)"
    >
      <template #icon><component :is="icon" aria-hidden="true" :size="18" /></template>
      <span class="nana-visually-hidden">{{ label }}</span>
    </NanaButton>
  </NanaTooltip>
</template>
