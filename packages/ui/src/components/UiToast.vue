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
      <X :size="12" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.ui-toast { display: flex; width: min(240px, 92vw); min-width: 0; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 0; border-radius: var(--radius-sm); background: var(--bg-subtle); box-shadow: var(--shadow-menu); color: var(--text); }
.ui-toast--info { background: var(--accent-soft); color: var(--accent); }
.ui-toast--success { background: var(--ok-soft); color: var(--ok); }
.ui-toast--warning { background: var(--warn-soft); color: var(--warn); }
.ui-toast--error { background: var(--err-soft); color: var(--err); }
.ui-toast__content { min-width: 0; }
.ui-toast__title { display: block; font-size: 12px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.ui-toast__description { margin: 2px 0 0; opacity: 0.85; font-size: 11px; font-weight: 400; line-height: 1.4; overflow-wrap: anywhere; }
.ui-toast__dismiss { display: inline-grid; width: 20px; height: 20px; flex: 0 0 20px; place-items: center; border: 0; border-radius: var(--radius-xs); background: transparent; color: inherit; opacity: 0.7; cursor: pointer; }
.ui-toast__dismiss:hover { background: var(--bg-hover); opacity: 1; }
.ui-toast__dismiss:focus-visible { outline: 2px solid var(--accent); }
</style>
