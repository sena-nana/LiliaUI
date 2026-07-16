<script setup lang="ts">
import ChevronRight from "@lucide/vue/dist/esm/icons/chevron-right.mjs";
import type { Component } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { RouterLink } from "vue-router";

export type LiliaSidebarRowTone = "default" | "warning" | "error";
export type LiliaSidebarRowState = "idle" | "active" | "ancestor-active" | "disabled";

export interface LiliaSidebarRowProps {
  label: string;
  icon?: Component;
  to?: RouteLocationRaw;
  trailing?: string | number;
  count?: number;
  depth?: number;
  active?: boolean;
  ancestorActive?: boolean;
  tone?: LiliaSidebarRowTone;
  disabled?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  title?: string;
  agentId?: string;
}

const props = withDefaults(defineProps<LiliaSidebarRowProps>(), {
  icon: undefined,
  to: undefined,
  trailing: undefined,
  count: undefined,
  depth: 0,
  active: false,
  ancestorActive: false,
  tone: "default",
  disabled: false,
  collapsible: false,
  expanded: true,
  title: undefined,
  agentId: undefined,
});

const emit = defineEmits<{
  select: [event: MouseEvent];
  toggle: [expanded: boolean];
}>();

function select(event: MouseEvent) {
  if (props.disabled) return;
  emit("select", event);
}

function toggle(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return;
  emit("toggle", !props.expanded);
}

function onKeydown(event: KeyboardEvent) {
  if (!props.collapsible || props.disabled) return;
  if (event.key === "ArrowRight" && !props.expanded) {
    event.preventDefault();
    emit("toggle", true);
  } else if (event.key === "ArrowLeft" && props.expanded) {
    event.preventDefault();
    emit("toggle", false);
  }
}
</script>

<template>
  <div
    class="lilia-sidebar-row"
    :class="[
      `lilia-sidebar-row--${tone}`,
      {
        'is-active': active,
        'is-ancestor-active': ancestorActive && !active,
        'is-disabled': disabled,
      },
    ]"
    :style="{ '--lilia-sidebar-depth': Math.max(0, depth) }"
  >
    <RouterLink
      v-if="to && !disabled"
      :to="to"
      class="lilia-sidebar-row__control sb-tree__row"
      :class="{ 'is-active': active }"
      exact-active-class="is-active"
      :title="title"
      :aria-expanded="collapsible ? expanded : undefined"
      :data-agent-id="agentId"
      @click="select"
      @keydown="onKeydown"
    >
      <span
        v-if="collapsible"
        class="lilia-sidebar-row__toggle"
        aria-hidden="true"
        @click="toggle"
      >
        <ChevronRight :size="12" aria-hidden="true" />
      </span>
      <slot name="icon">
        <component v-if="icon" :is="icon" class="lilia-sidebar-row__icon" :size="14" aria-hidden="true" />
      </slot>
      <span class="lilia-sidebar-row__label sb-tree__name">{{ label }}</span>
      <span v-if="$slots.trailing || trailing !== undefined || count !== undefined" class="lilia-sidebar-row__metadata">
        <slot name="trailing">
          <span v-if="trailing !== undefined" class="lilia-sidebar-row__trailing">{{ trailing }}</span>
          <span v-if="count !== undefined" class="lilia-sidebar-row__count">{{ count }}</span>
        </slot>
      </span>
    </RouterLink>

    <button
      v-else
      type="button"
      class="lilia-sidebar-row__control sb-tree__row"
      :class="{ 'is-active': active }"
      :disabled="disabled"
      :title="title"
      :aria-expanded="collapsible ? expanded : undefined"
      :data-agent-id="agentId"
      @click="select"
      @keydown="onKeydown"
    >
      <span
        v-if="collapsible"
        class="lilia-sidebar-row__toggle lilia-sidebar-row__toggle--embedded"
        aria-hidden="true"
        @click="toggle"
      >
        <ChevronRight :size="12" aria-hidden="true" />
      </span>
      <slot name="icon">
        <component v-if="icon" :is="icon" class="lilia-sidebar-row__icon" :size="14" aria-hidden="true" />
      </slot>
      <span class="lilia-sidebar-row__label sb-tree__name">{{ label }}</span>
      <span v-if="$slots.trailing || trailing !== undefined || count !== undefined" class="lilia-sidebar-row__metadata">
        <slot name="trailing">
          <span v-if="trailing !== undefined" class="lilia-sidebar-row__trailing">{{ trailing }}</span>
          <span v-if="count !== undefined" class="lilia-sidebar-row__count">{{ count }}</span>
        </slot>
      </span>
    </button>

    <div v-if="$slots.tools" class="lilia-sidebar-row__tools" @click.stop>
      <slot name="tools" />
    </div>
  </div>
</template>

<style scoped>
.lilia-sidebar-row {
  position: relative;
  min-width: 0;
}

.lilia-sidebar-row__control {
  width: 100%;
  height: 28px;
  min-width: 0;
  padding: 0 8px 0 calc(4px + var(--lilia-sidebar-depth) * 14px);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.lilia-sidebar-row__control:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.lilia-sidebar-row__control:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: -2px;
}

.lilia-sidebar-row.is-active .lilia-sidebar-row__control,
.lilia-sidebar-row__control.is-active {
  background: var(--bg-active);
  color: var(--accent);
}

.lilia-sidebar-row.is-ancestor-active .lilia-sidebar-row__control {
  color: var(--text);
}

.lilia-sidebar-row.is-ancestor-active .lilia-sidebar-row__label {
  font-weight: 600;
}

.lilia-sidebar-row--warning .lilia-sidebar-row__control {
  color: var(--warn);
}

.lilia-sidebar-row--error .lilia-sidebar-row__control {
  color: var(--err);
}

.lilia-sidebar-row.is-disabled .lilia-sidebar-row__control,
.lilia-sidebar-row__control:disabled {
  background: transparent;
  color: var(--text-faint);
  cursor: not-allowed;
  opacity: 0.68;
}

.lilia-sidebar-row__toggle {
  width: 14px;
  height: 20px;
  flex: 0 0 14px;
}

.lilia-sidebar-row__toggle {
  padding: 0;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lilia-sidebar-row__toggle:hover {
  background: var(--bg-hover);
}

.lilia-sidebar-row__toggle svg {
  transition: transform 0.12s ease;
}

.lilia-sidebar-row__control[aria-expanded="true"] .lilia-sidebar-row__toggle svg {
  transform: rotate(90deg);
}

.lilia-sidebar-row__toggle--embedded {
  pointer-events: auto;
}

.lilia-sidebar-row__icon {
  flex: 0 0 auto;
}

.lilia-sidebar-row__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lilia-sidebar-row__metadata {
  min-width: 0;
  flex: 0 1 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.lilia-sidebar-row__trailing {
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lilia-sidebar-row__count {
  min-width: 18px;
  height: 17px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--bg-subtle);
  line-height: 17px;
  text-align: center;
}

.lilia-sidebar-row__tools {
  position: absolute;
  top: 50%;
  right: 5px;
  z-index: 1;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.lilia-sidebar-row:hover .lilia-sidebar-row__tools,
.lilia-sidebar-row:focus-within .lilia-sidebar-row__tools {
  opacity: 1;
  pointer-events: auto;
}

.lilia-sidebar-row:has(.lilia-sidebar-row__tools):hover .lilia-sidebar-row__metadata,
.lilia-sidebar-row:has(.lilia-sidebar-row__tools):focus-within .lilia-sidebar-row__metadata {
  opacity: 0;
}
</style>
