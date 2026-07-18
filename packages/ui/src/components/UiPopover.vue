<script setup lang="ts">
import type { OpenStateEmits, PopoverProps } from "@lilia/ui-contract";
import { useDismissableLayer } from "@lilia/ui-foundation/overlay";
import { nextTick, ref, toRef, watch } from "vue";
import "./overlay.css";

const props = withDefaults(defineProps<PopoverProps>(), {
  ariaLabel: undefined,
  placement: "bottom",
  closeOnEscape: true,
  closeOnOutside: true,
  agentId: undefined,
});
const emit = defineEmits<OpenStateEmits>();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);

function setOpen(open: boolean) {
  emit("update:open", open);
  if (!open) emit("close");
}

useDismissableLayer({
  open: toRef(props, "open"),
  root,
  trigger,
  close: () => setOpen(false),
  closeOnEscape: props.closeOnEscape,
  closeOnOutside: props.closeOnOutside,
});

watch(() => props.open, (open) => {
  if (open) {
    void nextTick(() => root.value?.querySelector<HTMLElement>(
      "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    )?.focus());
  } else {
    trigger.value?.querySelector<HTMLElement>("button, [href], [tabindex]")?.focus();
  }
}, { immediate: true });
</script>

<template>
  <span class="ui-popover">
    <span
      ref="trigger"
      class="ui-popover__trigger"
      :aria-expanded="open"
      @click="setOpen(!open)"
      @keydown.enter.prevent="setOpen(!open)"
      @keydown.space.prevent="setOpen(!open)"
    ><slot name="trigger" /></span>
    <div
      v-if="open"
      ref="root"
      class="ui-popover__surface"
      :class="`ui-popover__surface--${placement}`"
      role="dialog"
      :aria-label="ariaLabel"
      :data-agent-id="agentId"
      tabindex="-1"
    ><slot /></div>
  </span>
</template>
