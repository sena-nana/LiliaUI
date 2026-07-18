import { spawn } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { readText } from "./files.mjs";

const LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "pnpm-lock.yaml"];

export async function executeUiTransaction(plan, options = {}) {
  if (plan.blockers.length) return result("blocked", { blockers: plan.blockers });
  if (options.check) return result(plan.operations.length ? "changes_required" : "unchanged");
  if (options.dryRun) return result(plan.operations.length ? "planned" : "unchanged");
  if (!plan.operations.length) return result("unchanged");
  if (plan.git?.dirty && !options.force) {
    return result("blocked", {
      blockers: [{
        id: "dirty-worktree",
        severity: "error",
        detail: "The Git worktree is dirty. Use --check/--dry-run, commit changes, or explicitly pass --force.",
        files: plan.git.entries,
      }],
    });
  }

  const backups = await captureBackups(plan);
  const changed = [];
  let commandsStarted = false;
  try {
    for (const operation of plan.operations) {
      await assertUnchanged(plan.projectRoot, operation);
      await atomicReplace(plan.projectRoot, operation.path, operation.after);
      changed.push(operation.path);
    }
    const commandResults = [];
    commandsStarted = plan.commands.length > 0;
    for (const command of plan.commands) {
      commandResults.push(await (options.commandRunner ?? runCommand)(command, plan.projectRoot, options.env));
    }
    return result("changed", { changed, commands: commandResults });
  } catch (error) {
    const restorePaths = new Set([
      ...changed,
      ...(commandsStarted ? LOCKFILES : []),
    ]);
    const rollback = await restoreBackups(
      plan.projectRoot,
      backups.filter((backup) => restorePaths.has(backup.path)),
    );
    return result("rolled_back", {
      changed,
      error: error instanceof Error ? error.message : String(error),
      rollback,
      blockers: [{ id: "transaction-failed", severity: "error", detail: String(error), files: changed }],
    });
  }
}

async function captureBackups(plan) {
  const paths = new Set([...plan.operations.map((item) => item.path), ...LOCKFILES]);
  const backups = [];
  for (const path of paths) {
    assertProjectPath(plan.projectRoot, path);
    backups.push({ path, content: await readText(join(plan.projectRoot, path)) });
  }
  return backups;
}

async function assertUnchanged(projectRoot, operation) {
  const current = await readText(join(projectRoot, operation.path));
  if (current !== operation.before) {
    throw new Error(`File changed after planning: ${operation.path}`);
  }
}

async function atomicReplace(projectRoot, path, content) {
  assertProjectPath(projectRoot, path);
  const target = join(projectRoot, path);
  if (content === null) {
    await rm(target, { force: true });
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.lilia-${process.pid}-${Date.now()}.tmp`;
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function restoreBackups(projectRoot, backups) {
  const restored = [];
  const failed = [];
  for (const backup of [...backups].reverse()) {
    try {
      await atomicReplace(projectRoot, backup.path, backup.content);
      restored.push(backup.path);
    } catch (error) {
      failed.push({ path: backup.path, error: error.message });
    }
  }
  return { complete: failed.length === 0, restored, failed };
}

async function runCommand(command, cwd, env) {
  return await new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command.command, command.args ?? [], {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectCommand);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectCommand(new Error(`${command.id} failed with exit code ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      resolveCommand({ id: command.id, code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function assertProjectPath(projectRoot, path) {
  if (isAbsolute(path)) throw new Error(`Operation path must be relative: ${path}`);
  const resolvedRoot = resolve(projectRoot);
  const target = resolve(resolvedRoot, path);
  const pathFromRoot = relative(resolvedRoot, target);
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error(`Operation escapes project root: ${path}`);
  }
}

function result(status, extra = {}) {
  return { status, changed: [], commands: [], blockers: [], ...extra };
}
