#!/usr/bin/env node

import { runBuildCli } from "../src/index.mjs";

runBuildCli(process.argv.slice(2), {
  env: process.env,
  projectRoot: process.cwd(),
});
