<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref } from "vue";
import type { DialogProps } from "@lilia/ui-contract";
import NanaIconButton from "./NanaIconButton.vue";

const props = withDefaults(defineProps<DialogProps>(), {
  closeOnEscape: true,
  closeOnOutside: true,
  initialFocus: "first-action",
});
const emit = defineEmits<{ "update:open": [open: boolean]; close: [] }>();
const root = ref<HTMLElement | null>(null);
const close = () => { emit("update:open", false); emit("close"); };
const dialog = useDialogPrimitive(
  props,
  root,
  close,
  () => root.value?.querySelector<HTMLElement>(".nana-dialog__body button:not(:disabled), .nana-dialog__actions button:not(:disabled)") ?? null,
);
</script>

<template>
  <Teleport to="body">
    <Transition name="nana-fade">
      <div
        v-if="open"
        ref="root"
        class="nana-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :data-agent-id="agentId"
        tabindex="-1"
        @click="dialog.onOutsidePointer"
        @keydown="dialog.onKeydown"
      >
        <section class="nana-dialog">
          <header class="nana-dialog__header">
            <div><h2>{{ title }}</h2><p v-if="description">{{ description }}</p></div>
            <NanaIconButton :icon="X" label="关闭" @click="close" />
          </header>
          <div class="nana-dialog__body"><slot /></div>
          <footer v-if="$slots.actions || $slots.footer" class="nana-dialog__actions"><slot name="actions"><slot name="footer" /></slot></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
