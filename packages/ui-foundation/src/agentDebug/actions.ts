import type { AgentDebugAction } from "./types";

export async function performAgentDebugAction(action: AgentDebugAction) {
  if (action.type === "mark") return;
  if (action.type === "hotkey") {
    const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
    const init: KeyboardEventInit = { ...action, bubbles: true, cancelable: true };
    target.dispatchEvent(new KeyboardEvent("keydown", init));
    target.dispatchEvent(new KeyboardEvent("keyup", init));
    return;
  }
  const target = findAgentTarget(action.target);
  if (action.type === "click") {
    target.click();
    return;
  }
  if (action.clear) setElementValue(target, "");
  setElementValue(target, action.text);
}

function findAgentTarget(agentId: string): HTMLElement {
  const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(agentId)
    : agentId.replace(/["\\]/g, "\\$&");
  const element = document.querySelector<HTMLElement>(`[data-agent-id="${escaped}"]`);
  if (!element) throw new Error(`Agent debug target not found: ${agentId}`);
  return element;
}

function setElementValue(element: HTMLElement, value: string) {
  element.focus();
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
  } else if (element.isContentEditable) {
    element.textContent = value;
  } else {
    throw new Error(`Agent debug target is not text-editable: ${element.dataset.agentId ?? element.tagName}`);
  }
  element.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
