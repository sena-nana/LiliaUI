import type { AgentDebugLogEntry, AppendAgentDebugLog } from "./types";

export interface AgentDebugLogStore {
  append: AppendAgentDebugLog;
  clear(): void;
  entries(): AgentDebugLogEntry[];
}

let activeAppender: AppendAgentDebugLog | null = null;

export function createAgentDebugLogStore(maxEntries: number): AgentDebugLogStore {
  let entries: AgentDebugLogEntry[] = [];
  return {
    append(entry) {
      entries = [...entries, { ...entry, timestamp: Date.now() }].slice(-maxEntries);
    },
    clear() {
      entries = [];
    },
    entries() {
      return [...entries];
    },
  };
}

export function setActiveAgentDebugLogAppender(appender: AppendAgentDebugLog | null) {
  activeAppender = appender;
}

export function recordAgentDebugLog(entry: Omit<AgentDebugLogEntry, "timestamp">): boolean {
  if (!activeAppender) return false;
  activeAppender(entry);
  return true;
}

export function reasonMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return "Unhandled rejection";
}
