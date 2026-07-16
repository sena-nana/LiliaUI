<script setup lang="ts">
import { nextTick, ref, toRef, watch } from "vue";
import { useAnchoredPosition } from "@lilia/ui-foundation/anchored-position";
import { useDismissableLayer } from "@lilia/ui-foundation/overlay";
import type { PopoverProps } from "@lilia/ui-contract";

const props = withDefaults(defineProps<PopoverProps>(), { placement: "bottom", closeOnEscape: true, closeOnOutside: true });
const emit = defineEmits<{ "update:open": [open: boolean]; close: [] }>();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const setOpen = (open: boolean) => {
  emit("update:open", open);
  if (!open) emit("close");
};
useDismissableLayer({
  open: toRef(props, "open"),
  root,
  trigger,
  close: () => setOpen(false),
  closeOnEscape: props.closeOnEscape,
  closeOnOutside: props.closeOnOutside,
});
const { style } = useAnchoredPosition({
  open: toRef(props, "open"),
  anchor: trigger,
  surface: root,
  placement: toRef(props, "placement"),
});
watch(() => props.open, (open) => {
  if (open) {
    void nextTick(() => root.value?.querySelector<HTMLElement>(
      "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    )?.focus());
  } else {
    trigger.value?.querySelector<HTMLElement>("button, [href], [tabindex]")?.focus();
  }
});
</script>

<template>
  <span ref="trigger" class="nana-popover-anchor" :aria-expanded="open" @click="setOpen(!open)" @keydown.enter.prevent="setOpen(!open)" @keydown.space.prevent="setOpen(!open)"><slot name="trigger" /></span>
  <Teleport to="body"><div v-if="open" ref="root" class="nana-popover" :class="`nana-popover--${placement}`" :style="style" role="dialog" :data-agent-id="agentId"><slot /></div></Teleport>
</template>
