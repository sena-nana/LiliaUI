import type { SurfaceMode } from "@lilia/ui-contract";
import type { BackdropMode, BackdropTarget } from "../config/appShell";

export interface ResolvedBackdropSurfaces {
  workspace: SurfaceMode;
  sidebar: SurfaceMode;
  main: SurfaceMode;
}

/** Map window backdrop settings to region surface modes. AppShell keeps sole `native` ownership. */
export function resolveBackdropSurfaces(
  backdropMode: BackdropMode,
  backdropTarget: BackdropTarget,
): ResolvedBackdropSurfaces {
  if (backdropMode === "solid") {
    return { workspace: "solid", sidebar: "solid", main: "solid" };
  }
  return {
    workspace: "translucent",
    sidebar: backdropTarget === "sidebar" ? "translucent" : "solid",
    main: backdropTarget === "main" ? "translucent" : "solid",
  };
}
