import type { App } from "vue";
import { installContextMenu, uninstallContextMenu } from "./composables/useContextMenu";
import { useCornerStyle } from "./composables/useCornerStyle";
import {
  installGlobalScrollbarVisibility,
  uninstallGlobalScrollbarVisibility,
} from "./composables/useGlobalScrollbarVisibility";
import { useNativeAppearance } from "./composables/useNativeAppearance";
import { setLiliaAppConfig, type LiliaAppConfig } from "./config/appShell";
import { vContextMenu } from "./directives/contextMenu";

export interface InstallLiliaAppRuntimeOptions {
  app?: App;
  config: LiliaAppConfig;
}

export function installLiliaAppRuntime(options: InstallLiliaAppRuntimeOptions) {
  setLiliaAppConfig(options.config);
  const { contextMenu = true, globalScrollbar = true } = options.config.runtime ?? {};
  if (contextMenu) {
    installContextMenu();
    options.app?.directive("contextMenu", vContextMenu);
    options.app?.directive("context-menu", vContextMenu);
  } else {
    uninstallContextMenu();
  }
  if (globalScrollbar) {
    installGlobalScrollbarVisibility();
  } else {
    uninstallGlobalScrollbarVisibility();
  }
  useCornerStyle();
  useNativeAppearance();
}
