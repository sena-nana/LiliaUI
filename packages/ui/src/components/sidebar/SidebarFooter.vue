<script setup lang="ts">
import { RouterLink } from "vue-router";
import type {
  SidebarFooterLink,
  SidebarFooterStatus,
} from "../../config/appShell";

defineProps<{
  links: SidebarFooterLink[];
  statuses: SidebarFooterStatus[];
}>();
</script>

<template>
  <div class="sb-footer">
    <RouterLink
      v-for="link in links"
      :key="link.label"
      :to="link.to"
      class="sb-footer__btn"
      active-class="is-active"
      :title="link.title ?? link.label"
      :aria-label="link.label"
      :data-agent-id="`sidebar.footer.${link.key}`"
    >
      <component :is="link.icon" :size="14" aria-hidden="true" />
    </RouterLink>

    <div
      class="sb-footer__statuses"
      :class="{ 'sb-footer__statuses--single': statuses.length < 2 }"
    >
      <RouterLink
        v-for="(status, index) in statuses"
        :key="status.key"
        :to="status.to"
        class="sb-conn"
        :class="`sb-conn--${status.tone}`"
        :title="status.title"
        :data-agent-id="index === 0
          ? 'sidebar.footer.status'
          : `sidebar.footer.status.${status.key}`"
      >
        <span
          class="sb-conn__content"
          :data-agent-id="index === 0 && status.key !== 'status'
            ? `sidebar.footer.status.${status.key}`
            : undefined"
        >
          <component
            :is="status.icon"
            class="sb-conn__icon"
            :size="12"
            aria-hidden="true"
          />
          <span class="sb-conn__label">{{ status.label }}</span>
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.sb-footer {
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  width: 100%;
}

.sb-footer__btn {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: calc(var(--app-corner-radius) * 0.625);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  opacity: 0.44;
  transition: opacity 0.35s ease, background-color 0.12s ease, color 0.12s ease;
  flex-shrink: 0;
}

.sb-footer__btn:hover {
  background: var(--bg-hover);
  color: var(--text);
  filter: none;
}

.sb-footer:hover .sb-footer__btn,
.sb-footer:focus-within .sb-footer__btn,
.sb-footer__btn.is-active {
  opacity: 1;
}

.sb-footer__btn.is-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.sb-footer__statuses {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 4px;
  overflow: hidden;
}

.sb-conn {
  display: flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-decoration: none;
  min-width: 0;
  overflow: hidden;
  opacity: 0.62;
  flex: 1 1 0;
  transition: opacity 0.35s ease, background-color 0.12s ease, color 0.12s ease;
}

.sb-footer__statuses--single .sb-conn {
  flex: 0 1 auto;
}

.sb-conn__content {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
  width: 100%;
}

.sb-conn__icon {
  flex: 0 0 auto;
}

.sb-footer:hover .sb-conn,
.sb-footer:focus-within .sb-conn {
  opacity: 1;
}

.sb-conn--ok {
  background: var(--accent-soft);
  color: var(--accent);
}

.sb-conn--warn {
  background: var(--warn-soft);
  color: var(--warn);
  opacity: 0.82;
}

.sb-conn--error {
  background: var(--err-soft);
  color: var(--err);
  opacity: 0.9;
}

.sb-conn__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
