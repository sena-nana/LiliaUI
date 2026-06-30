import type { App } from "vue";
import { installContextMenu } from "./composables/useContextMenu";
import { useCornerStyle } from "./composables/useCornerStyle";
import { installGlobalScrollbarVisibility } from "./composables/useGlobalScrollbarVisibility";
import { useTheme } from "./composables/useTheme";
import { setLiliaAppConfig, type LiliaAppConfig } from "./config/appShell";
import { vContextMenu } from "./directives/contextMenu";

export interface InstallLiliaAppRuntimeOptions {
  app?: App;
  config: LiliaAppConfig;
}

export function installLiliaAppRuntime(options: InstallLiliaAppRuntimeOptions) {
  setLiliaAppConfig(options.config);
  installContextMenu();
  installGlobalScrollbarVisibility();
  useTheme();
  useCornerStyle();
  options.app?.directive("contextMenu", vContextMenu);
  options.app?.directive("context-menu", vContextMenu);
}
