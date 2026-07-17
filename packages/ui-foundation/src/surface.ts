import type {
  BackdropEffect,
  SurfaceDataAttributes,
  SurfaceLevel,
  SurfaceMode,
  SurfaceProps,
} from "@lilia/ui-contract";

export const DEFAULT_SURFACE_MODE: SurfaceMode = "solid";
export const DEFAULT_BACKDROP_EFFECT: BackdropEffect = "none";
export const DEFAULT_SURFACE_LEVEL: SurfaceLevel = "base";

export function resolveSurfaceAttributes(
  surface: SurfaceProps = {},
): SurfaceDataAttributes {
  const mode = surface.surfaceMode ?? DEFAULT_SURFACE_MODE;
  const requestedBackdrop = surface.backdropEffect ?? DEFAULT_BACKDROP_EFFECT;
  const backdrop = mode === "solid" ? DEFAULT_BACKDROP_EFFECT : requestedBackdrop;

  return {
    "data-lilia-surface-mode": mode,
    "data-lilia-backdrop": backdrop,
    "data-lilia-surface-level": surface.surfaceLevel ?? DEFAULT_SURFACE_LEVEL,
    ...(surface.surfaceBoundary ? { "data-lilia-surface-boundary": "" as const } : {}),
  };
}
