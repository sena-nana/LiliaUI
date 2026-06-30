<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon?: unknown;
  agentId?: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  role?: string;
}>(), {
  icon: undefined,
  agentId: undefined,
  disabled: false,
  danger: false,
  active: false,
  role: "menuitem",
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function onClick(event: MouseEvent) {
  if (props.disabled) return;
  emit("click", event);
}
</script>

<template>
  <button
    type="button"
    class="sb-menu__item"
    :class="{
      'is-active': active,
      'is-danger': danger,
    }"
    :disabled="disabled"
    :role="role"
    :data-agent-id="agentId"
    @click="onClick"
  >
    <component v-if="icon" :is="icon" :size="13" aria-hidden="true" />
    <span class="sb-menu__label">
      <slot />
    </span>
  </button>
</template>
