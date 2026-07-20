import {
  defineComponent,
  getCurrentInstance,
  h,
  type Component,
  type ComponentObjectPropsOptions,
  type DefineComponent,
} from "vue";
import LiliaWorkspaceRegion from "./LiliaWorkspaceRegion.vue";
import type { LiliaWorkspaceRegionProps } from "./types";

type WorkspaceRegionPresetProps = Omit<LiliaWorkspaceRegionProps, "role"> & {
  role?: LiliaWorkspaceRegionProps["role"];
};
type WorkspaceRegionPreset = DefineComponent<WorkspaceRegionPresetProps>;
const regionRuntimeProps = (
  LiliaWorkspaceRegion as unknown as { props: ComponentObjectPropsOptions }
).props;
const presetRuntimeProps = {
  ...regionRuntimeProps,
  role: {
    ...(regionRuntimeProps.role as Record<string, unknown>),
    required: false,
  },
} as ComponentObjectPropsOptions;

function hyphenate(value: string) {
  return value.replace(/\B([A-Z])/g, "-$1").toLowerCase();
}

function createWorkspaceRegionPreset(
  name: string,
  defaults: Partial<LiliaWorkspaceRegionProps>,
  presetClass: string,
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    props: presetRuntimeProps,
    setup(props, { attrs, slots }) {
      const instance = getCurrentInstance();
      const regionProps = props as Record<string, unknown>;
      return () => h(LiliaWorkspaceRegion as Component, {
        ...defaults,
        ...Object.fromEntries(Object.keys(presetRuntimeProps).flatMap((key) => {
          const provided = instance?.vnode.props;
          return provided && (
            Object.prototype.hasOwnProperty.call(provided, key)
            || Object.prototype.hasOwnProperty.call(provided, hyphenate(key))
          )
            ? [[key, regionProps[key]]]
            : [];
        })),
        ...attrs,
        class: [presetClass, attrs.class],
      }, slots);
    },
  }) as unknown as WorkspaceRegionPreset;
}

export const LiliaGlobalNavigation = createWorkspaceRegionPreset("LiliaGlobalNavigation", {
  role: "global-navigation",
  placement: "start",
  as: "nav",
  defaultSize: 56,
  minSize: 44,
  maxSize: 96,
  overflow: "hidden",
}, "lilia-workspace-region--global-navigation");

export const LiliaSectionNavigation = createWorkspaceRegionPreset("LiliaSectionNavigation", {
  role: "section-navigation",
  placement: "start",
  as: "nav",
  defaultSize: 220,
  minSize: 160,
  maxSize: 420,
  narrowBehavior: "collapse",
  collapseBelow: 720,
  responsivePriority: 1,
}, "lilia-workspace-region--section-navigation");

export const LiliaResourcePanel = createWorkspaceRegionPreset("LiliaResourcePanel", {
  role: "resources",
  placement: "start",
  as: "aside",
  defaultSize: 260,
  minSize: 180,
  maxSize: 520,
  narrowBehavior: "overlay",
  collapseBelow: 860,
  responsivePriority: 2,
}, "lilia-workspace-region--resources");

export const LiliaPrimaryContent = createWorkspaceRegionPreset("LiliaPrimaryContent", {
  role: "primary",
  placement: "primary",
  as: "main",
  minSize: 320,
  fillPriority: 1,
}, "lilia-workspace-region--primary");

export const LiliaInspector = createWorkspaceRegionPreset("LiliaInspector", {
  role: "inspector",
  placement: "end",
  as: "aside",
  defaultSize: 280,
  minSize: 200,
  maxSize: 560,
  narrowBehavior: "collapse",
  collapseBelow: 960,
  responsivePriority: 0,
}, "lilia-workspace-region--inspector");

export const LiliaBottomPanel = createWorkspaceRegionPreset("LiliaBottomPanel", {
  role: "utility",
  placement: "bottom",
  scope: "primary",
  as: "section",
  defaultSize: 200,
  minSize: 96,
  maxSize: 520,
  narrowBehavior: "shrink",
}, "lilia-workspace-region--bottom");
