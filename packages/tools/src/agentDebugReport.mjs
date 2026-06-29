import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { readAppConfig, readJson } from "@lilia/config";

export function createAgentDebugReportFromTemplate(projectRoot, options, createTemplateReport) {
  const template = createTemplateReport(projectRoot, options);
  const packageJson = readJson(resolve(projectRoot, "package.json"));
  const appConfig = readAppConfig(projectRoot);
  const envPrefix = toEnvPrefix(appConfig.appName);
  const runtimeTools = [
    runtimeTool("node", ["--version"], "runs shared Lilia tooling"),
    runtimeTool("cargo", ["--version"], "installs tauri-driver when desktop UI replay is needed"),
    runtimeTool("tauri-driver", ["--help"], "bridges WebDriver actions to a Tauri desktop app"),
    runtimeTool("msedgedriver", ["--version"], "drives Microsoft Edge for WebDriver-based desktop checks"),
    runtimeTool("MicrosoftWebDriver", ["--version"], "legacy Microsoft WebDriver fallback"),
  ];
  const checks = createChecks(template);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: "agent-debug-readiness",
    project: template.project,
    status: checks.every((check) => check.ok) ? "ready" : "needs_attention",
    scripts: {
      agentDebug: packageJson.scripts?.["agent:debug"] ?? null,
      verifyAgentDebug: packageJson.scripts?.["verify:agent-debug"] ?? null,
    },
    environment: {
      frontendFlag: "VITE_LILIA_AGENT_DEBUG=1",
      backendFlag: "LILIA_AGENT_DEBUG=1",
      devPortVariable: `${envPrefix}_DEV_PORT`,
      strictPortVariable: `${envPrefix}_DEV_STRICT_PORT`,
    },
    runtimeTools,
    desktopReplay: {
      available: hasRuntimeTool(runtimeTools, "tauri-driver") && hasAnyRuntimeTool(runtimeTools, ["msedgedriver", "MicrosoftWebDriver"]),
      requiredForReadiness: false,
      note: "Desktop replay uses external tools when a final app defines real agent-debug scenarios.",
    },
    checks,
    template,
  };
}

export function printAgentDebugReport(report) {
  console.log(`${report.project.productTitle} agent debug readiness`);
  console.log(`status: ${report.status}`);
  console.log(`root: ${report.project.root}`);
  console.log("");
  console.log("environment:");
  console.log(`- frontend: ${report.environment.frontendFlag}`);
  console.log(`- backend: ${report.environment.backendFlag}`);
  console.log(`- dev port: ${report.environment.devPortVariable}`);
  console.log("");
  console.log("checks:");
  for (const check of report.checks) {
    console.log(`- ${check.ok ? "ok" : "fail"} ${check.id}: ${check.detail}`);
  }
  console.log("");
  console.log("runtime tools:");
  for (const tool of report.runtimeTools) {
    console.log(`- ${tool.available ? "ok" : "missing"} ${tool.id}: ${tool.purpose}`);
  }
  console.log("");
  console.log("agent targets:");
  for (const target of report.template.agentTargets) {
    console.log(`- ${target.exists ? "ok" : "missing"} ${target.id}: ${target.path}`);
  }
}

function createChecks(template) {
  return [
    {
      id: "template-ready",
      ok: template.status === "ready",
      detail: `template status=${template.status}`,
    },
    {
      id: "agent-targets-ready",
      ok: template.agentTargets.every((target) => target.exists),
      detail: `${template.agentTargets.filter((target) => target.exists).length}/${template.agentTargets.length} stable targets present`,
    },
  ];
}

function runtimeTool(command, args, purpose) {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    shell: false,
    stdio: "pipe",
  });
  return {
    id: command,
    available: result.error === undefined && result.status === 0,
    purpose,
    detail: result.error?.message ?? firstLine(result.stdout || result.stderr),
  };
}

function hasRuntimeTool(runtimeTools, id) {
  return runtimeTools.some((tool) => tool.id === id && tool.available);
}

function hasAnyRuntimeTool(runtimeTools, ids) {
  return ids.some((id) => hasRuntimeTool(runtimeTools, id));
}

function firstLine(value = "") {
  return value.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "";
}

function toEnvPrefix(appName) {
  return appName.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}
