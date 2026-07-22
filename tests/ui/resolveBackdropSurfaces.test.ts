import { describe, expect, it } from "vitest";
import { resolveBackdropSurfaces } from "@lilia/ui/composables";

describe("resolveBackdropSurfaces", () => {
  it("keeps every region solid when backdropMode is solid", () => {
    expect(resolveBackdropSurfaces("solid", "sidebar")).toEqual({
      workspace: "solid",
      sidebar: "solid",
      main: "solid",
    });
  });

  it("makes workspace and sidebar translucent for mica sidebar target", () => {
    expect(resolveBackdropSurfaces("mica", "sidebar")).toEqual({
      workspace: "translucent",
      sidebar: "translucent",
      main: "solid",
    });
  });

  it("makes workspace and main translucent for acrylic main target", () => {
    expect(resolveBackdropSurfaces("acrylic", "main")).toEqual({
      workspace: "translucent",
      sidebar: "solid",
      main: "translucent",
    });
  });
});
