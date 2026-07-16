import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = JSON.parse(readFileSync(resolve("dist/.vite/manifest.json"), "utf8"));
const pageEntries = ["HomePage.vue", "EditorPage.vue", "SettingsPage.vue", "OnboardingPage.vue"];

for (const page of pageEntries) {
  const [source, entry] = Object.entries(manifest).find(([key]) => key.endsWith(`/pages/${page}`)) ?? [];
  if (!source || !entry?.isDynamicEntry) {
    throw new Error(`${page} must remain an asynchronous route chunk.`);
  }
}

console.log(`Verified ${pageEntries.length} asynchronous Nana page routes.`);
