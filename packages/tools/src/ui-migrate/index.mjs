import { executeUiTransaction } from "../ui-preset/transaction.mjs";
import { inspectUiProject } from "../ui-preset/inspect.mjs";
import { inspectUiMigration } from "./inspect.mjs";
import { createUiMigrationPlan } from "./plan.mjs";
import { createMigrationReport, formatMigrationReport } from "./report.mjs";

export { inspectUiMigration } from "./inspect.mjs";
export { createUiMigrationPlan } from "./plan.mjs";
export { createMigrationReport, formatMigrationReport } from "./report.mjs";

export async function runUiMigration(projectRoot = process.cwd(), options = {}) {
  const inspection = await inspectUiMigration(projectRoot, options);
  const target = options.preset ?? inspection.project.current.preset;
  if (!options.preset) {
    const hasWork = inspection.safeChanges.length > 0 || inspection.blockers.length > 0;
    const result = { status: hasWork ? "needs_attention" : inspection.project.status, blockers: inspection.blockers };
    return createMigrationReport({ inspection, result });
  }
  const plan = await createUiMigrationPlan(inspection, target, options);
  plan.git = inspection.project.git;
  const result = await executeUiTransaction(plan, options);
  const current = result.status === "changed"
    ? { ...inspection, project: await inspectUiProject(projectRoot, options) }
    : inspection;
  return createMigrationReport({ inspection: current, plan, result });
}
