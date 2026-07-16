import { formatUiReport, runUiPreset } from "./index.mjs";

export async function runUiPresetCli(args, options = {}) {
  const action = args.find((arg) => !arg.startsWith("-")) ?? "status";
  const report = await runUiPreset(options.projectRoot ?? process.cwd(), action, {
    check: args.includes("--check"),
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    env: options.env,
  });
  (options.stdout ?? process.stdout).write(formatUiReport(report, { json: args.includes("--json") }));
  if (["blocked", "changes_required", "needs_attention", "rolled_back"].includes(report.status)) {
    process.exitCode = 1;
  }
  return report;
}
