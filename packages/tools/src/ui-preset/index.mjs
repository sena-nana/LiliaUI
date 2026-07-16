import { inspectUiProject } from "./inspect.mjs";
import { createUiPresetPlan } from "./plan.mjs";
import { executeUiTransaction } from "./transaction.mjs";
import { createUiReport, formatUiReport } from "./report.mjs";

export { inspectUiProject } from "./inspect.mjs";
export { createUiPresetPlan, derivePackageSpecifier } from "./plan.mjs";
export { executeUiTransaction } from "./transaction.mjs";
export { createUiReport, formatUiReport } from "./report.mjs";
export { findModuleSpecifiers, rewriteModuleSpecifiers } from "./imports.mjs";
export {
  UI_LAYER_PACKAGES,
  UI_LAYER_SUBPATHS,
  UI_PRESETS,
  UI_SHARED_PACKAGES,
} from "./definitions.mjs";

export async function runUiPreset(projectRoot = process.cwd(), action = "status", options = {}) {
  const inspection = await inspectUiProject(projectRoot, options);
  if (action === "status") return createUiReport({ kind: "ui-preset", inspection });
  const plan = await createUiPresetPlan(inspection, action, options);
  plan.git = inspection.git;
  const result = await executeUiTransaction(plan, options);
  const current = result.status === "changed"
    ? await inspectUiProject(projectRoot, options)
    : inspection;
  return createUiReport({ kind: "ui-preset", inspection: current, plan, result });
}
