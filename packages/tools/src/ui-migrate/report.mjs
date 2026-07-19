import { createUiReport } from "../ui-preset/report.mjs";

export function createMigrationReport({ inspection, plan = null, result = null }) {
  return {
    ...createUiReport({ kind: "ui-migrate", inspection: inspection.project, plan, result }),
    migration: {
      safeChanges: inspection.safeChanges,
      legacyShellMigrations: inspection.legacyShellMigrations,
      manualUiReview: inspection.manualUiReview,
      contractIncompatibilities: inspection.contractIncompatibilities,
      informationArchitectureReview: inspection.informationArchitectureReview,
      recoveryFeedbackGaps: inspection.recoveryFeedbackGaps,
      bundleStyleConflicts: inspection.bundleStyleConflicts,
    },
  };
}

export function formatMigrationReport(report, options = {}) {
  if (options.json) return `${JSON.stringify(report, null, 2)}\n`;
  const lines = ["ui-migrate report", `status: ${report.status}`];
  append(lines, "Safe changes applied", report.changes.map((item) => `${item.action} ${item.path}`));
  append(lines, "Safe changes available", report.migration.safeChanges.map(describe));
  append(lines, "Manual UI review", report.migration.manualUiReview.map(describe));
  append(lines, "Contract incompatibilities", report.migration.contractIncompatibilities.map(describe));
  append(lines, "Information architecture review", report.migration.informationArchitectureReview.map(describe));
  append(lines, "Recovery/feedback gaps", report.migration.recoveryFeedbackGaps.map(describe));
  append(lines, "Bundle/style conflicts", report.migration.bundleStyleConflicts.map(describe));
  append(lines, "Blockers", report.blockers.map((item) => `${item.id ?? item.severity}: ${item.detail}`));
  if (report.recovery) append(lines, "Recovery", [
    report.recovery.restored ? "All touched files were restored." : "Restoration incomplete.",
    `Reconcile installed dependencies with: ${report.recovery.command}`,
  ]);
  return `${lines.join("\n")}\n`;
}

function describe(item) {
  return `${item.path}: ${item.detail}`;
}

function append(lines, title, items) {
  if (!items.length) return;
  lines.push("", `${title}:`, ...items.map((item) => `- ${item}`));
}
