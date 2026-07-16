export function documentFor(root: ParentNode) {
  return root.ownerDocument ?? document;
}

export function click(root: ParentNode, selector: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Nana perf click target: ${selector}`);
  element.click();
}

export function input(root: ParentNode, selector: string, value: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing Nana perf input target: ${selector}`);
  }
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export function change(root: ParentNode, selector: string, value: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLSelectElement)) throw new Error(`Missing Nana perf select target: ${selector}`);
  element.value = value;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function keydown(root: ParentNode, selector: string, key: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Nana perf key target: ${selector}`);
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
}

export async function focusIn(root: ParentNode, selector: string) {
  const element = documentFor(root).querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Nana perf focus target: ${selector}`);
  element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function pointerDownOutside(root: ParentNode) {
  documentFor(root).body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
}
