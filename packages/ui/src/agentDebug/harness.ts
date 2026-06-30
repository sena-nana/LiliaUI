import { performAgentDebugAction } from "./actions";
import { isLiliaAgentDebugEnabled } from "./env";
import { createAgentDebugLogStore, reasonMessage } from "./log";
import { createAgentDebugSnapshot } from "./snapshot";
import type {
  AppendAgentDebugLog,
  InstallAgentDebugHarnessOptions,
  LiliaAgentDebugApi,
} from "./types";

const DEFAULT_MAX_LOG_ENTRIES = 50;
let installed = false;
let removeWindowListeners: (() => void) | null = null;
let clearLogStore: (() => void) | null = null;

type AgentDebugWindow = Window & {
  __liliaAgentDebug?: LiliaAgentDebugApi;
};

export function installAgentDebugHarness(options: InstallAgentDebugHarnessOptions = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (options.enabled !== true && !isLiliaAgentDebugEnabled()) return null;
  const debugWindow = window as AgentDebugWindow;
  if (installed && debugWindow.__liliaAgentDebug) return debugWindow.__liliaAgentDebug;

  const log = createAgentDebugLogStore(options.maxLogEntries ?? DEFAULT_MAX_LOG_ENTRIES);
  const observe = () => createAgentDebugSnapshot(log.entries());
  const api: LiliaAgentDebugApi = {
    async act(action) {
      log.append({ data: action, message: `agent-debug:${action.type}:start`, type: "action" });
      try {
        await performAgentDebugAction(action);
        log.append({ data: action, message: `agent-debug:${action.type}:success`, type: "action" });
      } catch (error) {
        log.append({
          data: action,
          message: error instanceof Error ? error.message : `agent-debug:${action.type}:failed`,
          type: "error",
        });
        throw error;
      }
      return observe();
    },
    getRecentErrors() {
      return log.entries();
    },
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
  if (typeof window !== "undefined") {
    const debugWindow = window as AgentDebugWindow;
    delete debugWindow.__liliaAgentDebug;
  }
  removeWindowListeners?.();
  clearLogStore?.();
  clearLogStore = null;
  removeWindowListeners = null;
  installed = false;
}

function installErrorListeners(appendLog: AppendAgentDebugLog) {
  const onError = (event: ErrorEvent) => {
    appendLog({ data: { filename: event.filename, line: event.lineno }, message: event.message, type: "error" });
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    appendLog({ data: event.reason, message: reasonMessage(event.reason), type: "error" });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
