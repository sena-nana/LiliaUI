import type { AgentDebugElementSnapshot, AgentDebugLogEntry, AgentDebugSnapshot } from "./types";

export function createAgentDebugSnapshot(recentErrors: AgentDebugLogEntry[]): AgentDebugSnapshot {
  return {
    activeElement: elementSnapshot(document.activeElement),
    elements: Array.from(document.querySelectorAll<HTMLElement>("[data-agent-id]"))
      .map(elementSnapshot)
      .filter((value): value is AgentDebugElementSnapshot => value !== null),
    recentErrors,
    route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    title: document.title,
    viewport: { height: window.innerHeight, width: window.innerWidth },
  };
}

function elementSnapshot(element: Element | null): AgentDebugElementSnapshot | null {
  if (!(element instanceof HTMLElement) || !element.dataset.agentId) return null;
  return {
    agentId: element.dataset.agentId,
    ariaLabel: element.getAttribute("aria-label"),
    disabled: element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true",
    role: element.getAttribute("role"),
    tagName: element.tagName.toLowerCase(),
    text: (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160),
    title: element.getAttribute("title"),
  };
}
