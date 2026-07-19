#!/usr/bin/env node

import { enableNodeCompileCache } from "../src/nodeRuntime.mjs";

enableNodeCompileCache(process.env, process.argv.slice(2));

const [command, ...args] = process.argv.slice(2);
const options = { env: process.env, projectRoot: process.cwd() };

if (command === "ui-preset") {
  const { runUiPresetCli } = await import("../src/ui-preset/cli.mjs");
  await runUiPresetCli(args, options);
} else if (command === "ui-migrate") {
  const { runUiMigrationCli } = await import("../src/ui-migrate/cli.mjs");
  await runUiMigrationCli(args, options);
} else {
  const { runToolsCli } = await import("../src/index.mjs");
  await runToolsCli(process.argv.slice(2), options);
}
