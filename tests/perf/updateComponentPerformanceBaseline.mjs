import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "yarn";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "yarn vitest run --config vitest.perf.config.ts"]
  : ["vitest", "run", "--config", "vitest.perf.config.ts"];
const result = spawnSync(command, args, {
  env: {
    ...process.env,
    LILIA_UPDATE_PERF_BASELINE: "1",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
}
process.exitCode = result.status ?? 1;
