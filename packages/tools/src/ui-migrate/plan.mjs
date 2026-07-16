import { dirname, join, posix, relative } from "node:path";
import { createUiPresetPlan } from "../ui-preset/plan.mjs";
import { readText } from "../ui-preset/files.mjs";
import { rewriteModuleSpecifiers } from "../ui-preset/imports.mjs";
import { isLayerSpecifier } from "../ui-preset/definitions.mjs";

export async function createUiMigrationPlan(inspection, targetPreset, options = {}) {
  const presetPlan = await createUiPresetPlan(inspection.project, targetPreset, {
    ...options,
    allowDirectImports: true,
  });
  const operations = [...presetPlan.operations];
  const blockers = [...presetPlan.blockers, ...inspection.blockers];
  for (const path of [...new Set(inspection.directImports.map((item) => item.path))]) {
    const before = await readText(join(inspection.project.projectRoot, path));
    try {
      const after = rewriteModuleSpecifiers(before, path, (specifier) =>
        localFacadeSpecifier(path, specifier)).content;
      if (after !== before) operations.push({ path, before, after, reason: "facade-import" });
    } catch (error) {
      blockers.push({ id: "parse-error", severity: "error", detail: error.message, files: [path] });
    }
  }
  return {
    ...presetPlan,
    kind: "ui-migrate",
    operations: deduplicateOperations(operations),
    blockers: deduplicateBlockers(blockers),
    manualReview: [
      ...inspection.manualUiReview,
      ...inspection.informationArchitectureReview,
      ...inspection.recoveryFeedbackGaps,
    ].map((item) => `${item.path}: ${item.detail}`),
  };
}

function localFacadeSpecifier(filePath, specifier) {
  if (!isLayerSpecifier(specifier)) return specifier;
  const target = specifier.endsWith("/styles.css") ? "src/ui/styles.css" : "src/ui";
  let result = relative(dirname(filePath), target).replaceAll("\\", "/");
  result = posix.normalize(result);
  if (!result.startsWith(".")) result = `./${result}`;
  return result;
}

function deduplicateOperations(operations) {
  const byPath = new Map();
  for (const operation of operations) {
    const prior = byPath.get(operation.path);
    if (!prior) byPath.set(operation.path, operation);
    else if (prior.after !== operation.before) {
      throw new Error(`Migration generated conflicting operations for ${operation.path}.`);
    } else {
      byPath.set(operation.path, { ...operation, before: prior.before });
    }
  }
  return [...byPath.values()];
}

function deduplicateBlockers(blockers) {
  return [...new Map(blockers.map((item) => [
    `${item.id ?? item.severity}:${item.detail}:${(item.files ?? [item.path]).join(",")}`,
    item,
  ])).values()];
}
