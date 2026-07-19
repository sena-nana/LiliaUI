import { createApp, nextTick, type Component } from "vue";
import VisualFixture from "./VisualFixture.vue";
import type { VisualLayerComponents } from "./types.ts";

const search = new URLSearchParams(location.search);
const layer = search.get("layer") === "nana" ? "nana" : "lilia";
const theme = search.get("theme") === "dark" ? "dark" : "light";
const density = search.get("density") === "compact" ? "compact" : "comfortable";
const longText = search.get("long") === "1";
const focusInput = search.get("focus") === "1";

document.documentElement.dataset.theme = theme;
document.documentElement.dataset.uiPreset = layer;
document.documentElement.dataset.density = density;

const module = layer === "nana"
  ? await loadNanaLayer()
  : await loadLiliaLayer();

createApp(VisualFixture, {
  density,
  layer,
  longText,
  theme,
  ui: module,
}).mount("#app");

await nextTick();
if (focusInput) {
  document.querySelector<HTMLElement>('[data-agent-id="visual.input"]')?.focus();
}
document.documentElement.dataset.visualReady = "true";

async function loadLiliaLayer(): Promise<VisualLayerComponents> {
  await import("@lilia/ui/styles.css");
  const [ui, provider] = await Promise.all([import("@lilia/ui"), import("@lilia/ui/provider")]);
  return { ...pickComponents(ui), Provider: provider.LiliaUIProvider };
}

async function loadNanaLayer(): Promise<VisualLayerComponents> {
  await import("@lilia/nana-ui/styles.css");
  const [ui, provider] = await Promise.all([import("@lilia/nana-ui"), import("@lilia/nana-ui/provider")]);
  return {
    ...pickComponents(ui),
    Provider: provider.NanaUIProvider,
  };
}

function pickComponents(ui: ContractLayerModule): VisualLayerComponents {
  return {
    Button: ui.Button,
    Card: ui.Card,
    Checkbox: ui.Checkbox,
    FormField: ui.FormField,
    Input: ui.Input,
    InteractiveCard: ui.InteractiveCard,
    ListItem: ui.ListItem,
    Progress: ui.Progress,
    Skeleton: ui.Skeleton,
    StatusBadge: ui.StatusBadge,
    Tabs: ui.Tabs,
  };
}

type ContractLayerModule = Record<
  "Button" | "Card" | "Checkbox" | "FormField" | "Input" | "InteractiveCard" | "ListItem" | "Progress" | "Skeleton" | "StatusBadge" | "Tabs",
  Component
>;
