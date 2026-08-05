export const AGENT_DEBUG_REDACTED = "[redacted]";
export const AGENT_DEBUG_TRUNCATED = "[truncated]";

export interface AgentDebugRedactionContext {
  key: string | null;
  path: readonly string[];
  value: unknown;
}

export type AgentDebugRedactionDecision = "omit" | "preserve" | "redact" | undefined;
export type AgentDebugRedactionPolicy = (
  context: AgentDebugRedactionContext,
) => AgentDebugRedactionDecision;

export interface AgentDebugRedactionOptions {
  maxDepth?: number;
  maxEntries?: number;
  policy?: AgentDebugRedactionPolicy;
}

export interface AgentDebugSummaryOptions extends AgentDebugRedactionOptions {
  maxLength?: number;
}

const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_MAX_LENGTH = 500;
const SECRET_KEYS = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "clientsecret",
  "cookie",
  "devicecode",
  "password",
  "privatekey",
  "refreshtoken",
  "secret",
  "token",
]);

function isSecretKey(key: string): boolean {
  return SECRET_KEYS.has(key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
}

export function redactAgentDebugValue(
  value: unknown,
  options: AgentDebugRedactionOptions = {},
): unknown {
  const seen = new WeakSet<object>();
  const maxDepth = Math.max(0, options.maxDepth ?? DEFAULT_MAX_DEPTH);
  const maxEntries = Math.max(0, options.maxEntries ?? DEFAULT_MAX_ENTRIES);

  function visit(current: unknown, path: string[], key: string | null, depth: number): unknown {
    const decision = options.policy?.({ key, path, value: current });
    if (decision === "redact" || (decision !== "preserve" && key !== null && isSecretKey(key))) {
      return AGENT_DEBUG_REDACTED;
    }
    if (decision === "omit") return undefined;
    if (current === null || typeof current === "string" || typeof current === "boolean") return current;
    if (typeof current === "number") return Number.isFinite(current) ? current : String(current);
    if (typeof current === "bigint") return current.toString();
    if (typeof current === "undefined") return null;
    if (typeof current === "symbol" || typeof current === "function") return String(current);
    if (depth >= maxDepth) return AGENT_DEBUG_TRUNCATED;

    if (seen.has(current)) return "[circular]";
    seen.add(current);

    if (current instanceof Error) {
      return {
        name: current.name,
      };
    }
    if (Array.isArray(current)) {
      const items = current.slice(0, maxEntries).map((item, index) => (
        visit(item, [...path, String(index)], String(index), depth + 1)
      ));
      if (current.length > maxEntries) items.push(AGENT_DEBUG_TRUNCATED);
      return items;
    }

    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(current).slice(0, maxEntries)) {
      const child = visit(childValue, [...path, childKey], childKey, depth + 1);
      if (child !== undefined) output[childKey] = child;
    }
    if (Object.keys(current).length > maxEntries) output.__truncated__ = true;
    return output;
  }

  return visit(value, [], null, 0);
}

export function summarizeAgentDebugValue(
  value: unknown,
  options: AgentDebugSummaryOptions = {},
): string {
  const serialized = JSON.stringify(redactAgentDebugValue(value, options)) ?? "";
  const maxLength = Math.max(0, options.maxLength ?? DEFAULT_MAX_LENGTH);
  return serialized.length <= maxLength
    ? serialized
    : `${serialized.slice(0, maxLength)}${AGENT_DEBUG_TRUNCATED}`;
}
