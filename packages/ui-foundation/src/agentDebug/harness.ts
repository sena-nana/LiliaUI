import { performAgentDebugAction } from "./actions";
import { createAgentDebugLogStore, reasonMessage, setActiveAgentDebugLogAppender } from "./log";
import { createAgentDebugSnapshot } from "./snapshot";
import type { AppendAgentDebugLog, InstallAgentDebugHarnessOptions, LiliaAgentDebugApi } from "./types";

let installed = false;
let removeWindowListeners: (() => void) | null = null;
let clearLogStore: (() => void) | null = null;

type AgentDebugWindow = Window & { __liliaAgentDebug?: LiliaAgentDebugApi };

export function isLiliaAgentDebugEnabled(): boolean {
  const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
  return env?.VITE_LILIA_AGENT_DEBUG === "1" || env?.MODE === "agent-debug";
}

export function installAgentDebugHarness(options: InstallAgentDebugHarnessOptions = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (options.enabled !== true && !isLiliaAgentDebugEnabled()) return null;
  const debugWindow = window as AgentDebugWindow;
  if (installed && debugWindow.__liliaAgentDebug) return debugWindow.__liliaAgentDebug;

  const log = createAgentDebugLogStore(options.maxLogEntries ?? 50);
  setActiveAgentDebugLogAppender(log.append);
  const observe = () => createAgentDebugSnapshot(log.entries());
  const api: LiliaAgentDebugApi = {
    async act(action) {
      log.append({ data: action, message: `agent-debug:${action.type}:start`, type: "action" });
      try {
        await performAgentDebugAction(action);
        log.append({ data: action, message: `agent-debug:${action.type}:success`, type: "action" });
      } catch (error) {
        log.append({ data: action, message: error instanceof Error ? error.message : "agent-debug:failed", type: "error" });
        throw error;
      }
      return observe();
    },
    getRecentErrors: log.entries,
    mark(label, data) {
      log.append({ data, message: label, type: "mark" });
      return observe();
    },
    observe,
  };
  removeWindowListeners?.();
  clearLogStore = log.clear;
  removeWindowListeners = installErrorListeners(log.append);
  debugWindow.__liliaAgentDebug = api;
  installed = true;
  api.mark("agent-debug-installed", { route: api.observe().route });
  return api;
}

export function uninstallAgentDebugHarness() {
  if (typeof window !== "undefined") delete (window as AgentDebugWindow).__liliaAgentDebug;
  removeWindowListeners?.();
  clearLogStore?.();
  setActiveAgentDebugLogAppender(null);
  clearLogStore = null;
  removeWindowListeners = null;
  installed = false;
}

function installErrorListeners(appendLog: AppendAgentDebugLog) {
  const onError = (event: ErrorEvent) => appendLog({ data: { filename: event.filename, line: event.lineno }, message: event.message, type: "error" });
  const onUnhandledRejection = (event: PromiseRejectionEvent) => appendLog({ data: event.reason, message: reasonMessage(event.reason), type: "error" });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
