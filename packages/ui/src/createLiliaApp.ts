import { createApp, type Component } from "vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";
import AppRoot from "./AppRoot.vue";
import { installAgentDebugHarness } from "./agentDebug/index";
import LiliaDesktopShell from "./layouts/AppShell.vue";
import { installCommandRegistry, type LiliaCommandMap } from "./commands";
import { installContextMenu } from "./composables/useContextMenu";
import { useCornerStyle } from "./composables/useCornerStyle";
import { installGlobalScrollbarVisibility } from "./composables/useGlobalScrollbarVisibility";
import { useTheme } from "./composables/useTheme";
import { setLiliaAppConfig, type LiliaAppConfig } from "./config/appShell";
import { vContextMenu } from "./directives/contextMenu";

export interface CreateLiliaAppOptions {
  commands?: LiliaCommandMap;
  config: LiliaAppConfig;
  history?: RouterHistory;
  routes: RouteRecordRaw[];
  shell?: Component;
}

export function createLiliaRouter(
  routes: RouteRecordRaw[],
  shell: Component = LiliaDesktopShell,
  history: RouterHistory = createWebHistory(),
) {
  return createRouter({
    history,
    routes: [
      {
        path: "/",
        component: shell,
        meta: { sidebar: "main", returnable: true },
        children: routes,
      },
      { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
  });
}

export function createLiliaApp(options: CreateLiliaAppOptions) {
  setLiliaAppConfig(options.config);
  installContextMenu();
  installGlobalScrollbarVisibility();
  useTheme();
  useCornerStyle();
  installAgentDebugHarness();

  const router = createLiliaRouter(options.routes, options.shell, options.history);
  const app = createApp(AppRoot);
  app.use(router);
  app.directive("context-menu", vContextMenu);
  installCommandRegistry(app, options.commands);

  return { app, router };
}
