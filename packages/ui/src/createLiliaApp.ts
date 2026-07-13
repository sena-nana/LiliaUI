import { createApp, type Component } from "vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";
import AppRoot from "./AppRoot.vue";
import { isLiliaAgentDebugEnabled } from "./agentDebug/env";
import type { InstallAgentDebugHarnessOptions } from "./agentDebug/types";
import LiliaDesktopShell from "./layouts/AppShell.vue";
import { installCommandRegistry, type LiliaCommandMap } from "./commands";
import type { LiliaAppConfig } from "./config/appShell";
import { installLiliaAppRuntime } from "./runtime";
import { liliaAppOverlaysKey } from "./appOverlays";
import { liliaShellOptionsKey, type LiliaShellOptions } from "./shellOptions";

export interface CreateLiliaAppOptions {
  commands?: LiliaCommandMap;
  config: LiliaAppConfig;
  history?: RouterHistory;
  overlays?: Component[];
  routes: RouteRecordRaw[];
  shell?: Component;
  shellOptions?: LiliaShellOptions;
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
  app.provide(liliaAppOverlaysKey, options.overlays ?? []);
  app.provide(liliaShellOptionsKey, options.shellOptions ?? {});
  app.use(router);
  installCommandRegistry(app, options.commands);
  void installConfiguredAgentDebug(options.config);

  return { app, router };
}

function resolveAgentDebugOptions(config: LiliaAppConfig): InstallAgentDebugHarnessOptions | null {
  const agentDebug = config.runtime?.agentDebug;
  if (agentDebug === false) return null;
  if (agentDebug === true) return { enabled: true };
  if (agentDebug && typeof agentDebug === "object") {
    return { ...agentDebug, enabled: true };
  }
  return isLiliaAgentDebugEnabled() ? {} : null;
}

async function installConfiguredAgentDebug(config: LiliaAppConfig) {
  const debugOptions = resolveAgentDebugOptions(config);
  if (!debugOptions) return;
  const { installAgentDebugHarness } = await import("./agentDebug/index");
  installAgentDebugHarness(debugOptions);
}
