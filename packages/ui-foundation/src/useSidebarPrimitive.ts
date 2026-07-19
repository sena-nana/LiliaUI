import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { SidebarItem, SidebarMode } from "@lilia/ui-contract";

export interface SidebarPrimitive {
  mode: Ref<SidebarMode>;
  visibleItems: ComputedRef<readonly SidebarItem[]>;
  setMode: (mode: SidebarMode) => void;
  toggleMode: () => void;
  onItemKeydown: (
    event: KeyboardEvent,
    index: number,
    elementAt?: (index: number) => HTMLElement | null | undefined,
  ) => void;
}

export function useSidebarPrimitive(
  items: () => readonly SidebarItem[],
  defaultMode: SidebarMode = "expanded",
): SidebarPrimitive {
  const mode = ref<SidebarMode>(defaultMode);
  const visibleItems = computed(() => mode.value === "icon"
    ? items().filter((item) => (item.depth ?? 0) === 0)
    : items());
  const enabledNavigation = computed(() => {
    const indices: number[] = [];
    const positionByIndex = new Map<number, number>();
    visibleItems.value.forEach((item, index) => {
      if (item.disabled) return;
      positionByIndex.set(index, indices.length);
      indices.push(index);
    });
    return { indices, positionByIndex };
  });

  return {
    mode,
    visibleItems,
    setMode(next) {
      mode.value = next;
    },
    toggleMode() {
      mode.value = mode.value === "expanded" ? "icon" : "expanded";
    },
    onItemKeydown(event, index, elementAt) {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const { indices: enabled, positionByIndex } = enabledNavigation.value;
      if (enabled.length === 0) return;
      event.preventDefault();
      const current = positionByIndex.get(index) ?? -1;
      const next = event.key === "Home" ? 0
        : event.key === "End" ? enabled.length - 1
          : event.key === "ArrowUp" ? (current <= 0 ? enabled.length - 1 : current - 1)
            : (current < 0 || current === enabled.length - 1 ? 0 : current + 1);
      const targetIndex = enabled[next];
      const directTarget = elementAt?.(targetIndex);
      if (directTarget) {
        directTarget.focus();
        return;
      }
      const scope = (event.currentTarget as HTMLElement | null)?.closest("nav") ?? document;
      scope.querySelector<HTMLElement>(`[data-sidebar-index="${targetIndex}"]`)?.focus();
    },
  };
}
