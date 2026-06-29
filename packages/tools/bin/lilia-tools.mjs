#!/usr/bin/env node

import { runToolsCli } from "../src/index.mjs";

runToolsCli(process.argv.slice(2), {
  env: process.env,
  projectRoot: process.cwd(),
});
