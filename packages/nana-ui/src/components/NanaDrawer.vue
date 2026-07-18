<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import { useDialogPrimitive } from "@lilia/ui-foundation/dialog";
import { ref } from "vue";
import type { DrawerProps, OpenStateEmits } from "@lilia/ui-contract";
import NanaIconButton from "./NanaIconButton.vue";

const props = withDefaults(defineProps<DrawerProps>(), {
  description: undefined,
  side: "right",
  closeOnEscape: true,
  closeOnOutside: true,
  closeDisabled: false,
  closeAgentId: undefined,
  closeLabel: "关闭",
  initialFocus: "dialog",
});
const emit = defineEmits<OpenStateEmits>();
const root = ref<HTMLElement | null>(null);
const close = () => {
  if (props.closeDisabled) return;
  emit("update:open", false);
  emit("close");
};
const dialog = useDialogPrimitive(props, root, close);
</script>

<template>
  <Teleport to="body">
    <Transition name="nana-fade">
      <div v-if="open" ref="root" class="nana-overlay" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @click="dialog.onOutsidePointer" @keydown="dialog.onKeydown">
        <aside class="nana-drawer" :class="`nana-drawer--${side}`" :data-agent-id="agentId">
          <header class="nana-dialog__header"><div><h2><slot name="title">{{ title }}</slot></h2><p v-if="description">{{ description }}</p></div><NanaIconButton :icon="X" :label="closeLabel" :agent-id="closeAgentId" :disabled="closeDisabled" @click="close" /></header>
          <div class="nana-dialog__body"><slot /></div>
          <footer v-if="$slots.actions || $slots.footer" class="nana-dialog__actions"><slot name="footer"><slot name="actions" /></slot></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
