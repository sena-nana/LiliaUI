#!/usr/bin/env node

import { enableNodeCompileCache } from "../src/nodeRuntime.mjs";

enableNodeCompileCache(process.env, process.argv.slice(2));

const { runToolsCli } = await import("../src/index.mjs");
await runToolsCli(process.argv.slice(2), { env: process.env, projectRoot: process.cwd() });
