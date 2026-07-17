export function intersectRects(
  region: DOMRectReadOnly,
  workspace: DOMRectReadOnly,
): DOMRectReadOnly {
  const left = Math.max(region.left, workspace.left);
  const top = Math.max(region.top, workspace.top);
  const right = Math.max(left, Math.min(region.right, workspace.right));
  const bottom = Math.max(top, Math.min(region.bottom, workspace.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}
