#!/usr/bin/env node

import { enableNodeCompileCache } from "@lilia/tools/node-runtime";

enableNodeCompileCache(process.env, process.argv.slice(2));

const { runBuildCli } = await import("../src/index.mjs");

runBuildCli(process.argv.slice(2), {
  env: process.env,
  projectRoot: process.cwd(),
});
