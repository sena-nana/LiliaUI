import type { AgentDebugLogEntry, AppendAgentDebugLog } from "./types";

export interface AgentDebugLogStore {
  append: AppendAgentDebugLog;
  clear(): void;
  entries(): AgentDebugLogEntry[];
}

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

export function reasonMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return "Unhandled rejection";
}
