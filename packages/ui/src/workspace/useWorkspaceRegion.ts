import { inject, onScopeDispose, readonly } from "vue";
import { workspaceContextKey } from "./context";
import type { WorkspaceRegionGeometry } from "./types";

export function useWorkspaceRegion(id: string): WorkspaceRegionGeometry {
  const workspace = inject(workspaceContextKey);
  if (!workspace) {
    throw new Error("useWorkspaceRegion() must be called inside LiliaWorkspace.");
  }
  const { state: geometry, unsubscribe } = workspace.subscribeGeometry(id);
  onScopeDispose(unsubscribe);
  return {
    id,
    rect: readonly(geometry.rect),
    safeRect: readonly(geometry.safeRect),
    visible: readonly(geometry.visible),
    stable: readonly(geometry.stable),
  };
}
