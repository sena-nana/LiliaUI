import { formatMigrationReport, runUiMigration } from "./index.mjs";

export async function runUiMigrationCli(args, options = {}) {
  const presetIndex = args.indexOf("--preset");
  if (presetIndex >= 0 && (!args[presetIndex + 1] || args[presetIndex + 1].startsWith("-"))) {
    throw new Error("--preset requires lilia or nana.");
  }
  const preset = presetIndex >= 0 ? args[presetIndex + 1] : undefined;
  const report = await runUiMigration(options.projectRoot ?? process.cwd(), {
    preset,
    check: args.includes("--check"),
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    env: options.env,
  });
  (options.stdout ?? process.stdout).write(formatMigrationReport(report, { json: args.includes("--json") }));
  if (["blocked", "changes_required", "needs_attention", "rolled_back"].includes(report.status)) {
    process.exitCode = 1;
  }
  return report;
}
