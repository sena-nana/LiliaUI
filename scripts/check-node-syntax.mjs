#!/usr/bin/env node

import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: node scripts/check-node-syntax.mjs <file-or-directory> [...]");
  process.exit(1);
}

const files = inputs.flatMap((input) => collectJavaScriptFiles(resolve(input))).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function collectJavaScriptFiles(path) {
  const stats = statSync(path);
  if (stats.isFile()) return [path];
  if (!stats.isDirectory()) return [];

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(child);
    if (!entry.isFile() || !/\.(?:cjs|js|mjs)$/.test(entry.name)) return [];
    return [child];
  });
}
