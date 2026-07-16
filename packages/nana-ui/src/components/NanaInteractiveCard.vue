<script setup lang="ts">
import type { InteractiveCardProps } from "@lilia/ui-contract";
import NanaCard from "./NanaCard.vue";
withDefaults(defineProps<InteractiveCardProps>(), { selected: false, disabled: false, pressed: false });
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <NanaCard variant="interactive" :selected="selected" :disabled="disabled" :agent-id="agentId">
    <button type="button" class="nana-card__action" :disabled="disabled" :aria-pressed="pressed" @click="emit('select')">
      <slot />
    </button>
  </NanaCard>
</template>
