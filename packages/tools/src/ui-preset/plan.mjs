import { DEFAULT_UI_FILES, UI_PRESETS, assertPreset } from "./definitions.mjs";
import {
  createAppConfigOperation,
  createPackageJsonOperation,
} from "./dependencies.mjs";
import { createFacadeOperation } from "./facade.mjs";

export { derivePackageSpecifier } from "./dependencies.mjs";

export async function createUiPresetPlan(inspection, targetPreset, options = {}) {
  const preset = assertPreset(targetPreset);
  const blockingDrift = new Set(["dependency-source", "parse-error"]);
  if (!options.allowDirectImports) blockingDrift.add("direct-layer-import");
  const blockers = inspection.drift.filter((item) => blockingDrift.has(item.id));
  if (preset === "lilia" && inspection.appConfig.layout !== undefined) {
    blockers.push({
      id: "nana-layout",
      severity: "error",
      detail: "Remove or manually migrate app.config.json layout before selecting lilia.",
      files: ["app.config.json"],
    });
  }
  const operations = [];
  const packageOperation = createPackageJsonOperation(inspection, preset);
  collect(packageOperation, operations, blockers);
  collect(createAppConfigOperation(
    inspection,
    preset,
    options.appConfigPath ?? "app.config.json",
    UI_PRESETS[preset].defaultDensity,
  ), operations, blockers);
  for (const path of options.uiFiles ?? DEFAULT_UI_FILES) {
    collect(await createFacadeOperation(inspection.projectRoot, path, preset, options), operations, blockers);
  }
  return {
    schemaVersion: 1,
    kind: "ui-preset",
    projectRoot: inspection.projectRoot,
    from: inspection.current.preset,
    to: preset,
    source: inspection.current.source,
    operations,
    commands: planCommands(inspection.manifest, options),
    blockers,
    manualReview: [
      "Review information architecture and advanced-setting disclosure; preset switching does not rewrite business pages.",
    ],
    status: blockers.length ? "blocked" : operations.length ? "planned" : "unchanged",
  };
}

function collect(operation, operations, blockers) {
  if (operation.error) blockers.push(operation.error);
  else if (operation.after !== operation.before) operations.push(operation);
}

function planCommands(manifest, options) {
  if (options.commands) return options.commands;
  const commands = [{ id: "install", command: "yarn", args: ["install"] }];
  if (manifest.scripts?.typecheck) commands.push({ id: "typecheck", command: "yarn", args: ["typecheck"] });
  else if (manifest.scripts?.build) commands.push({ id: "build", command: "yarn", args: ["build"] });
  return commands;
}
