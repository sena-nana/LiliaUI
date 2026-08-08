import { computed, type Ref } from "vue";
import { getLiliaUiConfig } from "../config/appShell";
import { usePersistentBoolean } from "./usePersistentState";
import { useResizablePane } from "./useResizablePane";

const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 480;
const DEFAULT_WIDTH = 220;

/** Desktop shell sidebar collapse + resize for the legacy grid shell layout. */
export function useShellSidebar(disabled: Ref<boolean>) {
  const prefix = getLiliaUiConfig().storageKeyPrefix;
  const collapsed = usePersistentBoolean(`${prefix}.sidebarCollapsed`, false);
  const effectiveCollapsed = computed(() => !disabled.value && collapsed.value);

  const pane = useResizablePane({
    storageKey: `${prefix}.sidebarWidth`,
    minWidth: DEFAULT_MIN_WIDTH,
    maxWidth: DEFAULT_MAX_WIDTH,
    defaultWidth: DEFAULT_WIDTH,
    edge: "right",
    disabled: effectiveCollapsed,
  });

  const widthStyle = computed(() =>
    effectiveCollapsed.value ? "0px" : `${pane.width.value}px`,
  );

  function toggleCollapsed() {
    if (disabled.value) return;
    collapsed.value = !collapsed.value;
  }

  return {
    collapsed,
    effectiveCollapsed,
    isResizing: pane.isResizing,
    width: pane.width,
    widthStyle,
    minWidth: DEFAULT_MIN_WIDTH,
    maxWidth: DEFAULT_MAX_WIDTH,
    toggleCollapsed,
    startResize: pane.startResize,
    resetWidth: pane.resetWidth,
  };
}
