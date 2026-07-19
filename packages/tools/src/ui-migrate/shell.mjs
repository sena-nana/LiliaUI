import { basename, dirname, join, posix, relative } from "node:path";
import { readText } from "../ui-preset/files.mjs";

export const LEGACY_SHELL_COMPONENT_PATH = "src/ui/LegacyShell.vue";
export const LEGACY_SHELL_BARREL_PATH = "src/ui/legacy-shell.ts";

const MANAGED_SHELL_MARKER = "@lilia/ui-migrate:legacy-shell";
const LEGACY_NANA_PROPS = /(?:\bnavigation\b|navigationSections|navigation-sections|settingsItem|settings-item|sidebarMode|sidebar-mode|contextVisible|context-visible|contextTitle|context-title)/;
const KNOWN_LEGACY_LILIA_FILE_MARKERS = [
  "RouterView",
  "SettingsSidebar",
  "useRouteReturnTarget",
  "useShellSidebar",
  "liliaShellOptionsKey",
  "shell__resizer",
  "shell__main",
];

export function detectLegacyShellMigration(path, source, imports = []) {
  const layerSpecifiers = imports
    .map((item) => item.specifier)
    .filter((specifier) => specifier?.startsWith("@lilia/ui") || specifier?.startsWith("@lilia/nana-ui"));
  const copiedLegacyLilia = basename(path).toLowerCase() === "legacyappshell.vue";
  const knownCopiedLegacyLilia = copiedLegacyLilia
    && KNOWN_LEGACY_LILIA_FILE_MARKERS.every((marker) => source.includes(marker));
  const managed = source.includes(MANAGED_SHELL_MARKER);

  if (managed) {
    const layer = source.includes(`${MANAGED_SHELL_MARKER} nana`) ? "nana" : "lilia";
    return migration(path, layer, "managed-scaffold", "managed", true);
  }
  if (knownCopiedLegacyLilia) {
    return migration(path, "lilia", "legacy-app-shell", "replace-file", true);
  }
  if (copiedLegacyLilia && /(?:RouterView|useShellSidebar|liliaShellOptionsKey|shell__main)/.test(source)) {
    return migration(
      path,
      "lilia",
      "legacy-app-shell",
      "replace-file",
      false,
      "LegacyAppShell contains custom or unrecognized structure; refusing to overwrite it.",
    );
  }
  if (/\bNanaDesktopShell\b/.test(source) && layerSpecifiers.some(isNanaRootOrShell)) {
    return migration(path, "nana", "nana-desktop-shell", "redirect-import", true);
  }
  if (/\bNanaAppShell\b/.test(source) && LEGACY_NANA_PROPS.test(source)
    && layerSpecifiers.some(isNanaRootOrShell)) {
    return migration(path, "nana", "nana-app-shell-props", "redirect-import", true);
  }
  if (/\bLiliaDesktopShell\b/.test(source) && layerSpecifiers.some(isLiliaRootOrShell)) {
    return migration(path, "lilia", "lilia-desktop-shell", "redirect-import", true);
  }
  if (/\bLegacyAppShell\b/.test(source) && layerSpecifiers.some(isLiliaRootOrShell)) {
    return migration(path, "lilia", "legacy-app-shell", "redirect-import", true);
  }
  return null;
}

export function isLegacyShellSpecifier(migration, specifier) {
  if (migration.strategy !== "redirect-import") return false;
  return migration.layer === "nana" ? isNanaRootOrShell(specifier) : isLiliaRootOrShell(specifier);
}

export async function createLegacyShellScaffoldOperations(projectRoot, targetPreset, migrations) {
  const operations = [];
  const blockers = [];
  const automatic = migrations.filter((item) => item.automatic);
  if (targetPreset === "lilia" && automatic.some((item) => item.layer === "nana" && item.kind !== "managed-scaffold")) {
    blockers.push({
      id: "cross-layer-shell-migration",
      severity: "error",
      detail: "Old Nana navigation/context Shell cannot be mapped safely to the Lilia workspace skeleton.",
      files: automatic.filter((item) => item.layer === "nana").map((item) => item.path),
    });
  }

  for (const item of automatic.filter((candidate) => candidate.strategy === "replace-file")) {
    const before = await readText(join(projectRoot, item.path));
    operations.push({
      path: item.path,
      before,
      after: renderLegacyShellComponent(targetPreset, facadeSpecifier(item.path)),
      reason: "legacy-shell-scaffold",
    });
  }

  const needsStandardScaffold = automatic.some((item) =>
    item.strategy === "redirect-import" || item.strategy === "managed");
  if (needsStandardScaffold) {
    collectManagedOperation(
      await managedOperation(projectRoot, LEGACY_SHELL_COMPONENT_PATH, renderLegacyShellComponent(targetPreset, "./index")),
      operations,
      blockers,
    );
    collectManagedOperation(
      await managedOperation(projectRoot, LEGACY_SHELL_BARREL_PATH, renderLegacyShellBarrel(targetPreset)),
      operations,
      blockers,
    );
  }
  return { operations, blockers };
}

function renderLegacyShellComponent(preset, uiSpecifier = "./index") {
  return preset === "nana" ? renderNanaShell(uiSpecifier) : renderLiliaShell(uiSpecifier);
}

function renderLegacyShellBarrel(preset) {
  const packageName = preset === "nana" ? "@lilia/nana-ui" : "@lilia/ui";
  return `// ${MANAGED_SHELL_MARKER} ${preset}
export * from "${packageName}";
export * from "${packageName}/shell";
export {
  default as LegacyAppShell,
  default as LiliaDesktopShell,
  default as NanaAppShell,
  default as NanaDesktopShell,
} from "./LegacyShell.vue";
`;
}

function renderLiliaShell(uiSpecifier) {
  return `<!-- ${MANAGED_SHELL_MARKER} lilia -->
<script setup lang="ts">
import { RouterView } from "vue-router";
import { LiliaAppShell, LiliaPrimaryContent, LiliaWorkspace } from "${uiSpecifier}";
</script>

<template>
  <LiliaAppShell>
    <LiliaWorkspace aria-label="应用工作区">
      <LiliaPrimaryContent id="application-primary">
        <slot><RouterView /></slot>
      </LiliaPrimaryContent>
    </LiliaWorkspace>
  </LiliaAppShell>
</template>
`;
}

function renderNanaShell(uiSpecifier) {
  const contractSpecifier = uiSpecifier === "./index" ? "./contract" : `${uiSpecifier}/contract`;
  return `<!-- ${MANAGED_SHELL_MARKER} nana -->
<script setup lang="ts">
import { RouterView } from "vue-router";
import type { SidebarItem, SidebarMode, SidebarSection } from "${contractSpecifier}";
import { NanaAppShell, NanaSidebar } from "${uiSpecifier}";

defineProps<{
  title?: string;
  navigation?: readonly SidebarItem[];
  navigationSections?: readonly SidebarSection[];
  settingsItem?: SidebarItem;
  sidebarMode?: SidebarMode;
  contextVisible?: boolean;
  contextTitle?: string;
  agentId?: string;
}>();
const emit = defineEmits<{
  "update:sidebarMode": [mode: SidebarMode];
  selectNavigation: [item: SidebarItem];
}>();
</script>

<template>
  <NanaAppShell :title="title" :agent-id="agentId">
    <template #header-leading><slot name="titlebar-leading" /></template>
    <template #header-center><slot name="project" /></template>
    <template #header-actions>
      <slot name="save-state" />
      <slot name="device-state" />
      <slot name="runtime-state" />
    </template>
    <div class="lilia-legacy-nana-shell">
      <NanaSidebar
        :items="navigation"
        :sections="navigationSections"
        :settings-item="settingsItem"
        :mode="sidebarMode"
        @update:mode="emit('update:sidebarMode', $event)"
        @select="emit('selectNavigation', $event)"
      >
        <template #header><slot name="sidebar-header" /></template>
        <template #footer><slot name="sidebar-footer" /></template>
      </NanaSidebar>
      <main><slot><RouterView /></slot></main>
      <aside v-if="contextVisible" :aria-label="contextTitle ?? '属性'"><slot name="context" /></aside>
      <footer v-if="$slots.status"><slot name="status" /></footer>
    </div>
  </NanaAppShell>
</template>

<style scoped>
.lilia-legacy-nana-shell { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: minmax(0, 1fr) auto; min-width: 0; min-height: 0; height: 100%; }
.lilia-legacy-nana-shell > main { min-width: 0; min-height: 0; overflow: auto; }
.lilia-legacy-nana-shell > aside { min-width: 0; overflow: auto; }
.lilia-legacy-nana-shell > footer { grid-column: 1 / -1; }
</style>
`;
}

async function managedOperation(projectRoot, path, expected) {
  const before = await readText(join(projectRoot, path));
  if (before === null || before === expected) return { path, before, after: expected, reason: "legacy-shell-scaffold" };
  const known = path.endsWith(".vue")
    ? [renderLegacyShellComponent("lilia", "./index"), renderLegacyShellComponent("nana", "./index")]
    : [renderLegacyShellBarrel("lilia"), renderLegacyShellBarrel("nana")];
  if (known.includes(before)) return { path, before, after: expected, reason: "legacy-shell-scaffold" };
  return { error: {
    id: "legacy-shell-scaffold-conflict",
    severity: "error",
    detail: `Refusing to overwrite customized migration scaffold: ${path}.`,
    files: [path],
  } };
}

function collectManagedOperation(candidate, operations, blockers) {
  if (candidate.error) blockers.push(candidate.error);
  else if (candidate.after !== candidate.before) operations.push(candidate);
}

function facadeSpecifier(filePath) {
  let result = relative(dirname(filePath), "src/ui").replaceAll("\\", "/");
  result = posix.normalize(result);
  return result.startsWith(".") ? result : `./${result}`;
}

function migration(path, layer, kind, strategy, automatic, detail = null) {
  return {
    path,
    layer,
    kind,
    strategy,
    automatic,
    scaffoldPath: strategy === "replace-file" ? path : LEGACY_SHELL_COMPONENT_PATH,
    detail: detail ?? legacyDetail(layer, kind),
  };
}

function legacyDetail(layer, kind) {
  if (kind === "managed-scaffold") return `Refresh the managed ${layer} legacy Shell scaffold.`;
  return `Replace ${kind} with a consumer-owned ${layer} AppShell migration scaffold.`;
}

function isLiliaRootOrShell(specifier) {
  return specifier === "@lilia/ui" || specifier === "@lilia/ui/shell";
}

function isNanaRootOrShell(specifier) {
  return specifier === "@lilia/nana-ui" || specifier === "@lilia/nana-ui/shell";
}
