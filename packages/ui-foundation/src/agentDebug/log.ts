import type { AgentDebugLogEntry, AppendAgentDebugLog } from "./types";

let activeAppender: AppendAgentDebugLog | null = null;

export function createAgentDebugLogStore(maxEntries: number) {
  let entries: AgentDebugLogEntry[] = [];
  return {
    append(entry: Omit<AgentDebugLogEntry, "timestamp">) {
      entries = [...entries, { ...entry, timestamp: Date.now() }].slice(-maxEntries);
    },
    clear() { entries = []; },
    entries() { return [...entries]; },
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
  return typeof reason === "string" ? reason : "Unhandled rejection";
}
