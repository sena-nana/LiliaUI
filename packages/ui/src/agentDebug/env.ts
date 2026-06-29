export function isLiliaAgentDebugEnabled(): boolean {
  const env = import.meta.env as Record<string, unknown> | undefined;
  return env?.VITE_LILIA_AGENT_DEBUG === "1" || env?.MODE === "agent-debug";
}
