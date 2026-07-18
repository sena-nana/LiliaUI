<script setup lang="ts">
import X from "@lucide/vue/dist/esm/icons/x.mjs";
import type { ToastEmits, ToastProps } from "@lilia/ui-contract";

withDefaults(defineProps<ToastProps>(), {
  description: undefined,
  tone: "neutral",
  dismissible: true,
  agentId: undefined,
});
defineEmits<ToastEmits>();
</script>

<template>
  <section
    class="ui-toast"
    :class="`ui-toast--${tone}`"
    :role="tone === 'error' || tone === 'warning' ? 'alert' : 'status'"
    :data-agent-id="agentId"
  >
    <div class="ui-toast__content">
      <strong class="ui-toast__title">{{ title }}</strong>
      <p v-if="description" class="ui-toast__description">{{ description }}</p>
      <slot />
    </div>
    <button v-if="dismissible" class="ui-toast__dismiss" type="button" aria-label="关闭通知" @click="$emit('dismiss')">
      <X :size="15" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.ui-toast { display: flex; width: min(360px, 92vw); min-width: 0; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 11px 12px; border: 1px solid var(--border-soft); border-left: 3px solid var(--text-muted); border-radius: var(--radius-md); background: var(--bg-elev); box-shadow: var(--shadow-menu); color: var(--text); }
.ui-toast--info { border-left-color: var(--accent); }
.ui-toast--success { border-left-color: var(--ok); }
.ui-toast--warning { border-left-color: var(--warn); }
.ui-toast--error { border-left-color: var(--err); }
.ui-toast__content { min-width: 0; }
.ui-toast__title { display: block; font-size: 13px; overflow-wrap: anywhere; }
.ui-toast__description { margin: 3px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
.ui-toast__dismiss { display: inline-grid; width: 26px; height: 26px; flex: 0 0 26px; place-items: center; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); cursor: pointer; }
.ui-toast__dismiss:hover { background: var(--bg-hover); color: var(--text); }
.ui-toast__dismiss:focus-visible { outline: 2px solid var(--accent); }
</style>
