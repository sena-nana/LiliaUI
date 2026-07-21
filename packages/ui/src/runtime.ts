import type { App } from "vue";
import { installContextMenu } from "./composables/useContextMenu";
import { useCornerStyle } from "./composables/useCornerStyle";
export {
  installGlobalScrollbarVisibility,
  uninstallGlobalScrollbarVisibility,
} from "./composables/useGlobalScrollbarVisibility";
import { useNativeAppearance } from "./composables/useNativeAppearance";
import { vContextMenu } from "./directives/contextMenu";
export {
  getNativeAppearanceAdapter,
  setNativeAppearanceAdapter,
  type NativeAppearanceAdapter,
  type NativeBackdropRequest,
} from "@lilia/ui-foundation/native-appearance";

const contextMenuApps = new WeakSet<App>();

export function installLiliaContextMenu(app: App) {
  installContextMenu();
  if (!contextMenuApps.has(app)) {
    app.directive("contextMenu", vContextMenu);
    app.directive("context-menu", vContextMenu);
    contextMenuApps.add(app);
  }
}

export function installCornerStyle() {
  return useCornerStyle();
}

export function installNativeAppearance() {
  return useNativeAppearance();
}
