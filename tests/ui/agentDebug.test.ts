import { describe, expect, it } from "vitest";
import {
  installAgentDebugHarness,
  recordAgentDebugLog,
  uninstallAgentDebugHarness,
} from "@lilia/ui/diagnostics";

describe("Agent debug harness", () => {
  it("installs a visual-layer-neutral diagnostics API", () => {
    expect(installAgentDebugHarness).toBeTypeOf("function");
    expect(recordAgentDebugLog).toBeTypeOf("function");
  });
  it("observes and operates stable data-agent-id targets", async () => {
    let clicks = 0;
    document.body.innerHTML = `
      <button type="button" data-agent-id="home.primary">Run</button>
      <input data-agent-id="home.input" value="">
    `;
    document.querySelector("button")?.addEventListener("click", () => {
      clicks += 1;
    });

    const api = installAgentDebugHarness({ enabled: true });

    expect(api).not.toBeNull();
    expect(window.__liliaAgentDebug).toBe(api);
    expect(api?.observe().elements.map((element) => element.agentId)).toEqual([
      "home.primary",
      "home.input",
    ]);

    await api?.act({ target: "home.primary", type: "click" });
    expect(clicks).toBe(1);

    await api?.act({ target: "home.input", text: "hello", type: "type" });
    expect(document.querySelector<HTMLInputElement>("[data-agent-id='home.input']")?.value).toBe(
      "hello",
    );
    expect(api?.getRecentErrors().some((entry) => entry.message.includes("success"))).toBe(true);

    uninstallAgentDebugHarness();
    expect(window.__liliaAgentDebug).toBeUndefined();
  });

  it("records application debug log entries through the shared harness", () => {
    const api = installAgentDebugHarness({ enabled: true });

    expect(recordAgentDebugLog({
      data: { command: "workspace_status" },
      message: "invoke:workspace_status:start",
      type: "action",
    })).toBe(true);

    expect(api?.getRecentErrors().some((entry) => entry.message === "invoke:workspace_status:start")).toBe(true);

    uninstallAgentDebugHarness();
    expect(recordAgentDebugLog({
      message: "invoke:workspace_status:after-uninstall",
      type: "action",
    })).toBe(false);
  });
});
