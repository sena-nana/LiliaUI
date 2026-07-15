#!/usr/bin/env node

import { enableNodeCompileCache } from "../src/nodeRuntime.mjs";

enableNodeCompileCache(process.env, process.argv.slice(2));

const { runToolsCli } = await import("../src/index.mjs");

runToolsCli(process.argv.slice(2), {
  env: process.env,
  projectRoot: process.cwd(),
});
