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
import type { LiliaAppConfig } from "./config/appShell";
import { installLiliaAppRuntime } from "./runtime";

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
  const router = createLiliaRouter(options.routes, options.shell, options.history);
  const app = createApp(AppRoot);
  installLiliaAppRuntime({ app, config: options.config });
  app.use(router);
  installCommandRegistry(app, options.commands);
  installAgentDebugHarness();

  return { app, router };
}
