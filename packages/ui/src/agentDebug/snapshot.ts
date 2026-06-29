import type { AgentDebugElementSnapshot, AgentDebugLogEntry, AgentDebugSnapshot } from "./types";

export function createAgentDebugSnapshot(recentErrors: AgentDebugLogEntry[]): AgentDebugSnapshot {
  return {
    activeElement: elementSnapshot(document.activeElement),
    elements: Array.from(document.querySelectorAll<HTMLElement>("[data-agent-id]"))
      .map((element) => elementSnapshot(element))
      .filter((snapshot): snapshot is AgentDebugElementSnapshot => snapshot !== null),
    recentErrors,
    route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    title: document.title,
    viewport: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  };
}

function elementSnapshot(element: Element | null): AgentDebugElementSnapshot | null {
  if (!(element instanceof HTMLElement)) return null;
  const agentId = element.dataset.agentId;
  if (!agentId) return null;
  return {
    agentId,
    ariaLabel: element.getAttribute("aria-label"),
    disabled: isDisabled(element),
    role: element.getAttribute("role"),
    tagName: element.tagName.toLowerCase(),
    text: normalizeText(element.innerText || element.textContent || ""),
    title: element.getAttribute("title"),
  };
}

function isDisabled(element: HTMLElement): boolean {
  return element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}
