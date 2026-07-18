export interface AgentDebugElementSnapshot {
  agentId: string;
  ariaLabel: string | null;
  disabled: boolean;
  role: string | null;
  tagName: string;
  text: string;
  title: string | null;
}

export interface AgentDebugSnapshot {
  activeElement: AgentDebugElementSnapshot | null;
  elements: AgentDebugElementSnapshot[];
  recentErrors: AgentDebugLogEntry[];
  route: string;
  title: string;
  viewport: { height: number; width: number };
}

export interface AgentDebugLogEntry {
  data?: unknown;
  message: string;
  timestamp: number;
  type: "action" | "error" | "mark";
}

export type AgentDebugAction =
  | { target: string; type: "click" }
  | { clear?: boolean; target: string; text: string; type: "type" }
  | { altKey?: boolean; ctrlKey?: boolean; key: string; metaKey?: boolean; shiftKey?: boolean; type: "hotkey" }
  | { data?: unknown; label: string; type: "mark" };

export interface LiliaAgentDebugApi {
  act(action: AgentDebugAction): Promise<AgentDebugSnapshot>;
  getRecentErrors(): AgentDebugLogEntry[];
  mark(label: string, data?: unknown): AgentDebugSnapshot;
  observe(): AgentDebugSnapshot;
}

export interface InstallAgentDebugHarnessOptions {
  enabled?: boolean;
  maxLogEntries?: number;
}

export type AppendAgentDebugLog = (entry: Omit<AgentDebugLogEntry, "timestamp">) => void;
