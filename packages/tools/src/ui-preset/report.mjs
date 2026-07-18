export function createUiReport({ kind, inspection, plan = null, result = null }) {
  const changes = (plan?.operations ?? []).map((operation) => ({
    path: operation.path,
    action: operation.before === null ? "create" : operation.after === null ? "delete" : "update",
    reason: operation.reason,
  }));
  const blockers = [...(plan?.blockers ?? []), ...(result?.blockers ?? [])];
  return {
    schemaVersion: 1,
    kind,
    status: result?.status ?? inspection.status,
    current: inspection.current,
    target: plan?.to ?? null,
    git: inspection.git,
    drift: inspection.drift,
    changes,
    blockers,
    manualReview: plan?.manualReview ?? [],
    commands: result?.commands ?? [],
    recovery: result?.status === "rolled_back"
      ? {
          restored: result.rollback?.complete === true,
          details: result.rollback,
          error: result.error,
          command: "pnpm install",
        }
      : null,
  };
}

export function formatUiReport(report, options = {}) {
  if (options.json) return `${JSON.stringify(report, null, 2)}\n`;
  const lines = [
    `${report.kind} report`,
    `status: ${report.status}`,
    `preset: ${report.current.preset}`,
    `source: ${report.current.source}`,
  ];
  if (report.target) lines.push(`target: ${report.target}`);
  appendSection(lines, "Changes", report.changes.map((item) => `${item.action} ${item.path} (${item.reason})`));
  appendSection(lines, "Drift", report.drift.map((item) => `${item.severity} ${item.id}: ${item.detail}`));
  appendSection(lines, "Blockers", report.blockers.map((item) => `${item.id}: ${item.detail}`));
  appendSection(lines, "Manual UI review", report.manualReview);
  if (report.recovery) {
    appendSection(lines, "Recovery", [
      report.recovery.restored ? "All touched files were restored." : "Automatic restoration was incomplete.",
      report.recovery.error,
      `Reconcile installed dependencies with: ${report.recovery.command}`,
    ].filter(Boolean));
  }
  return `${lines.join("\n")}\n`;
}

function appendSection(lines, title, items) {
  if (!items.length) return;
  lines.push("", `${title}:`, ...items.map((item) => `- ${item}`));
}
