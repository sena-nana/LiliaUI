import { describe, expect, it } from "vitest";
import {
  AGENT_DEBUG_REDACTED,
  redactAgentDebugValue,
  summarizeAgentDebugValue,
} from "@lilia/ui-foundation/agent-debug";

describe("Agent Debug redaction", () => {
  it("keeps diagnostic structure while removing credentials", () => {
    const value = redactAgentDebugValue({
      command: "bind_github",
      args: {
        login: "octocat",
        deviceCode: "device-secret",
        authorization: "Bearer credential",
      },
    });

    expect(value).toEqual({
      command: "bind_github",
      args: {
        login: "octocat",
        deviceCode: AGENT_DEBUG_REDACTED,
        authorization: AGENT_DEBUG_REDACTED,
      },
    });
    expect(JSON.stringify(value)).not.toContain("device-secret");
    expect(JSON.stringify(value)).not.toContain("Bearer credential");
  });

  it("lets applications redact business payloads through a policy", () => {
    const summary = summarizeAgentDebugValue({
      repo: "sena-nana/LiliaGithub",
      body: "private issue body",
      nested: { fileContent: "private source" },
    }, {
      policy: ({ key }) => key === "body" || key === "fileContent" ? "redact" : undefined,
    });

    expect(summary).toContain("sena-nana/LiliaGithub");
    expect(summary).not.toContain("private issue body");
    expect(summary).not.toContain("private source");
  });

  it("bounds recursive and oversized diagnostics without throwing", () => {
    const circular: Record<string, unknown> = { id: "task" };
    circular.self = circular;

    expect(() => summarizeAgentDebugValue(circular, { maxLength: 24 })).not.toThrow();
    expect(summarizeAgentDebugValue([1, 2, 3], { maxEntries: 2 })).toContain("truncated");
  });

  it("does not expose arbitrary error messages", () => {
    const summary = summarizeAgentDebugValue(
      new Error("request failed for /Users/alice/private-repo with token-secret"),
    );

    expect(summary).toBe('{"name":"Error"}');
  });
});
