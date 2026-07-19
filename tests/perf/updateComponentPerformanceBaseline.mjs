import { spawnSync } from "node:child_process";

function run(command) {
  const result = spawnSync(command, {
    env: {
      ...process.env,
      LILIA_UPDATE_PERF_BASELINE: "1",
    },
    shell: true,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(result.error.message);
  }
  return result.status ?? 1;
}

for (const command of [
  "yarn vitest run --config vitest.perf.config.ts",
  "node tests/perf/componentPerformance.browser.ts",
]) {
  const status = run(command);
  if (status !== 0) {
    process.exitCode = status;
    break;
  }
}
