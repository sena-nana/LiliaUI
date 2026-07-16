export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

export function moveFocusWithin(root: HTMLElement | null, backwards: boolean): void {
  const candidates = getFocusableElements(root);
  if (candidates.length === 0) {
    root?.focus();
    return;
  }
  const activeElement = typeof document === "undefined" ? null : document.activeElement;
  const index = candidates.indexOf(activeElement as HTMLElement);
  const nextIndex = backwards
    ? (index <= 0 ? candidates.length - 1 : index - 1)
    : (index < 0 || index === candidates.length - 1 ? 0 : index + 1);
  candidates[nextIndex]?.focus();
}
