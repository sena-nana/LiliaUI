import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { SidebarItem, SidebarMode } from "@lilia/ui-contract";

export interface SidebarPrimitive {
  mode: Ref<SidebarMode>;
  visibleItems: ComputedRef<readonly SidebarItem[]>;
  setMode: (mode: SidebarMode) => void;
  toggleMode: () => void;
  onItemKeydown: (event: KeyboardEvent, index: number) => void;
}

export function useSidebarPrimitive(
  items: () => readonly SidebarItem[],
  defaultMode: SidebarMode = "expanded",
): SidebarPrimitive {
  const mode = ref<SidebarMode>(defaultMode);
  const visibleItems = computed(() => mode.value === "icon"
    ? items().filter((item) => (item.depth ?? 0) === 0)
    : items());

  return {
    mode,
    visibleItems,
    setMode(next) {
      mode.value = next;
    },
    toggleMode() {
      mode.value = mode.value === "expanded" ? "icon" : "expanded";
    },
    onItemKeydown(event, index) {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const enabled = visibleItems.value
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => !item.disabled);
      if (enabled.length === 0) return;
      event.preventDefault();
      const current = enabled.findIndex(({ itemIndex }) => itemIndex === index);
      const next = event.key === "Home" ? 0
        : event.key === "End" ? enabled.length - 1
          : event.key === "ArrowUp" ? (current <= 0 ? enabled.length - 1 : current - 1)
            : (current < 0 || current === enabled.length - 1 ? 0 : current + 1);
      const targetIndex = enabled[next]?.itemIndex;
      const scope = (event.currentTarget as HTMLElement | null)?.closest("nav") ?? document;
      scope.querySelector<HTMLElement>(`[data-sidebar-index="${targetIndex}"]`)?.focus();
    },
  };
}
