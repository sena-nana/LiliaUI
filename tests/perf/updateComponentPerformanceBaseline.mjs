import { spawnSync } from "node:child_process";

function run(command, extraEnvironment = {}) {
  const result = spawnSync(command, {
    env: {
      ...process.env,
      LILIA_UPDATE_PERF_BASELINE: "1",
      ...extraEnvironment,
    },
    shell: true,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(result.error.message);
  }
  return result.status ?? 1;
}

for (const [command, environment] of [
  ["yarn vitest run --config vitest.perf.config.ts", {}],
  ["node tests/perf/componentPerformance.browser.ts", { LILIA_PERF_BASELINE_SAMPLES: "3" }],
]) {
  const status = run(command, environment);
  if (status !== 0) {
    process.exitCode = status;
    break;
  }
}
