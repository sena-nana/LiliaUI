import type { CSSProperties } from "vue";
import type {
  WorkspaceLayoutModel,
  WorkspaceRegionLayout,
  WorkspaceRegionRegistration,
} from "./context";

const placementOrder = {
  start: 0,
  primary: 1,
  end: 2,
  top: 3,
  bottom: 4,
} as const;

function responsiveThreshold(region: WorkspaceRegionRegistration) {
  const explicit = region.collapseBelow.value;
  if (explicit !== null) return explicit;
  if (region.narrowBehavior.value === "none" || region.narrowBehavior.value === "shrink") return null;
  return Math.max(480, 960 - Math.max(0, region.responsivePriority.value) * 160);
}

function isResponsiveOverlay(region: WorkspaceRegionRegistration, inlineSize: number) {
  const threshold = responsiveThreshold(region);
  return threshold !== null
    && inlineSize > 0
    && inlineSize < threshold
    && region.narrowBehavior.value === "overlay";
}

function isResponsiveCollapsed(region: WorkspaceRegionRegistration, inlineSize: number) {
  const threshold = responsiveThreshold(region);
  return threshold !== null
    && inlineSize > 0
    && inlineSize < threshold
    && region.narrowBehavior.value === "collapse";
}

function isVisible(region: WorkspaceRegionRegistration, inlineSize: number) {
  return region.requestedVisible.value && !isResponsiveCollapsed(region, inlineSize);
}

function clampedSize(region: WorkspaceRegionRegistration) {
  const size = region.size.value;
  if (size === null) return null;
  return Math.min(region.maxSize.value, Math.max(region.minSize.value, size));
}

function track(region: WorkspaceRegionRegistration) {
  const fill = region.fillPriority.value;
  if (fill > 0) return `minmax(${region.minSize.value}px, ${fill}fr)`;
  const size = clampedSize(region);
  if (size === null) return "max-content";
  return `minmax(${region.minSize.value}px, ${size}px)`;
}

function regionLayout(style: CSSProperties): WorkspaceRegionLayout {
  return {
    style,
    visible: true,
    overlay: false,
    separator: null,
    edgeStart: false,
    edgeEnd: false,
    edgeTop: false,
    edgeBottom: false,
  };
}

function overlayStyle(region: WorkspaceRegionRegistration): CSSProperties {
  const size = clampedSize(region);
  const placement = region.placement.value;
  if (placement === "start" || placement === "end") {
    return {
      position: "absolute",
      insetBlock: "0",
      [placement === "start" ? "insetInlineStart" : "insetInlineEnd"]: "0",
      width: size === null ? undefined : `${size}px`,
      minWidth: `${region.minSize.value}px`,
      maxWidth: `${region.maxSize.value}px`,
      zIndex: 4 + region.responsivePriority.value,
    };
  }
  return {
    position: "absolute",
    insetInline: "0",
    [placement === "top" ? "insetBlockStart" : "insetBlockEnd"]: "0",
    height: size === null ? undefined : `${size}px`,
    minHeight: `${region.minSize.value}px`,
    maxHeight: `${region.maxSize.value}px`,
    zIndex: 4 + region.responsivePriority.value,
  };
}

export function createWorkspaceLayout(
  registrations: readonly WorkspaceRegionRegistration[],
  inlineSize: number,
): WorkspaceLayoutModel {
  const regions = [...registrations].sort((left, right) => left.order - right.order);
  const visible = regions.filter((region) => isVisible(region, inlineSize));
  const overlays = visible.filter((region) => isResponsiveOverlay(region, inlineSize));
  const attached = visible.filter((region) => !overlays.includes(region));
  const middle = attached
    .filter((region) => ["start", "primary", "end"].includes(region.placement.value))
    .sort((left, right) => {
      const placementDelta = placementOrder[left.placement.value] - placementOrder[right.placement.value];
      return placementDelta || left.order - right.order;
    });
  const workspaceTop = attached.filter((region) => region.placement.value === "top" && region.scope.value === "workspace");
  const primaryTop = attached.filter((region) => region.placement.value === "top" && region.scope.value === "primary");
  const primaryBottom = attached.filter((region) => region.placement.value === "bottom" && region.scope.value === "primary");
  const workspaceBottom = attached.filter((region) => region.placement.value === "bottom" && region.scope.value === "workspace");
  const columns = middle.length ? middle.map(track).join(" ") : "minmax(0, 1fr)";
  const rows = [
    ...workspaceTop.map(track),
    ...primaryTop.map(track),
    "minmax(0, 1fr)",
    ...primaryBottom.map(track),
    ...workspaceBottom.map(track),
  ].join(" ");
  const layouts = new Map<symbol, WorkspaceRegionLayout>();
  const primaryColumns = middle
    .map((region, index) => ({ region, column: index + 1 }))
    .filter(({ region }) => region.placement.value === "primary")
    .map(({ column }) => column);
  const primaryStart = primaryColumns[0] ?? 1;
  const primaryEnd = (primaryColumns[primaryColumns.length - 1] ?? (middle.length || 1)) + 1;
  const middleRow = workspaceTop.length + primaryTop.length + 1;
  const attachedMiddleRowStart = workspaceTop.length + 1;
  const attachedMiddleRowSpan = primaryTop.length + 1 + primaryBottom.length;

  workspaceTop.forEach((region, index) => {
    const layout = regionLayout({ gridColumn: "1 / -1", gridRow: `${index + 1}` });
    layout.separator = index > 0 ? "block" : null;
    layout.edgeStart = true;
    layout.edgeEnd = true;
    layout.edgeTop = index === 0;
    layouts.set(region.key, layout);
  });

  primaryTop.forEach((region, index) => {
    const layout = regionLayout({
      gridColumn: `${primaryStart} / ${primaryEnd}`,
      gridRow: `${workspaceTop.length + index + 1}`,
    });
    layout.separator = index > 0 || workspaceTop.length > 0 ? "block" : null;
    layout.edgeStart = primaryStart === 1;
    layout.edgeEnd = primaryEnd === middle.length + 1;
    layout.edgeTop = workspaceTop.length === 0 && index === 0;
    layouts.set(region.key, layout);
  });

  middle.forEach((region, index) => {
    const placement = region.placement.value;
    const layout = regionLayout({
      gridColumn: `${index + 1}`,
      gridRow: placement === "primary"
        ? `${middleRow}`
        : `${attachedMiddleRowStart} / span ${attachedMiddleRowSpan}`,
    });
    layout.separator = index > 0 ? "inline" : null;
    layout.edgeStart = index === 0;
    layout.edgeEnd = index === middle.length - 1;
    layout.edgeTop = workspaceTop.length === 0 && (placement !== "primary" || primaryTop.length === 0);
    layout.edgeBottom = workspaceBottom.length === 0 && (placement !== "primary" || primaryBottom.length === 0);
    layouts.set(region.key, layout);
  });

  primaryBottom.forEach((region, index) => {
    const layout = regionLayout({
      gridColumn: `${primaryStart} / ${primaryEnd}`,
      gridRow: `${middleRow + index + 1}`,
    });
    layout.separator = "block";
    layout.edgeStart = primaryStart === 1;
    layout.edgeEnd = primaryEnd === middle.length + 1;
    layout.edgeBottom = workspaceBottom.length === 0 && index === primaryBottom.length - 1;
    layouts.set(region.key, layout);
  });

  workspaceBottom.forEach((region, index) => {
    const row = middleRow + primaryBottom.length + index + 1;
    const layout = regionLayout({ gridColumn: "1 / -1", gridRow: `${row}` });
    layout.separator = "block";
    layout.edgeStart = true;
    layout.edgeEnd = true;
    layout.edgeBottom = index === workspaceBottom.length - 1;
    layouts.set(region.key, layout);
  });

  overlays.forEach((region) => {
    const layout = regionLayout(overlayStyle(region));
    layout.overlay = true;
    layout.edgeStart = region.placement.value !== "end";
    layout.edgeEnd = region.placement.value !== "start";
    layout.edgeTop = region.placement.value !== "bottom";
    layout.edgeBottom = region.placement.value !== "top";
    layouts.set(region.key, layout);
  });

  for (const region of regions) {
    if (layouts.has(region.key)) continue;
    layouts.set(region.key, {
      ...regionLayout({ display: "none" }),
      visible: false,
    });
  }

  return {
    columns,
    rows,
    regions: layouts,
    hasPrimary: middle.some((region) => region.placement.value === "primary"),
  };
}
