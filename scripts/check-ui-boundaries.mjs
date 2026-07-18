import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageRoots = ["ui-contract", "ui-foundation", "ui", "nana-ui"]
  .map((name) => resolve(root, "packages", name));
const sourceFiles = packageRoots.flatMap((packageRoot) => walk(resolve(packageRoot, "src")));
const violations = [];

const uiManifest = JSON.parse(readFileSync(resolve(root, "packages/ui/package.json"), "utf8"));
for (const [subpath, target] of Object.entries(uiManifest.exports ?? {})) {
  if (subpath.includes("*") || String(target).includes("*")) {
    violations.push(`packages/ui/package.json: wildcard export is forbidden: ${subpath}`);
  }
}

for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  const name = relative(root, file).replaceAll("\\", "/");
  const lines = source.split(/\r?\n/).length;
  if (!name.startsWith("packages/ui/") && lines > 300) {
    violations.push(`${name}: ${lines} lines exceeds the 300-line responsibility limit`);
  }
  if (name.startsWith("packages/ui-contract/") && /from\s+["'](?:vue|@lilia\/|.*\.css)/.test(source)) {
    violations.push(`${name}: ui-contract must remain type-first and visual-layer independent`);
  }
  if (name.startsWith("packages/ui-foundation/") && /from\s+["']@lilia\/(?:ui|nana-ui)(?:\/|["'])/.test(source)) {
    violations.push(`${name}: ui-foundation cannot depend on a visual layer`);
  }
  if (name.startsWith("packages/ui/") && /from\s+["']@lilia\/nana-ui(?:\/|["'])/.test(source)) {
    violations.push(`${name}: Professional Layer cannot depend on nana-ui`);
  }
  if (name.startsWith("packages/nana-ui/") && /from\s+["']@lilia\/ui(?:\/|["'])/.test(source)) {
    violations.push(`${name}: nana-ui cannot depend on the Professional Layer`);
  }
}

const packageGraph = new Map();
for (const packageRoot of packageRoots) {
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));
  const dependencies = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ].filter((name) => name.startsWith("@lilia/")));
  packageGraph.set(manifest.name, dependencies);
}
for (const packageName of packageGraph.keys()) detectCycle(packageName, [], new Set());

if (violations.length) {
  console.error("UI package boundary violations:");
  for (const violation of [...new Set(violations)]) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} UI Contract/Foundation/Layer source files.`);

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return [".ts", ".vue", ".css"].includes(extname(path)) ? [path] : [];
  });
}

function detectCycle(packageName, path, visited) {
  if (path.includes(packageName)) {
    violations.push(`package cycle: ${[...path, packageName].join(" -> ")}`);
    return;
  }
  if (visited.has(packageName)) return;
  visited.add(packageName);
  for (const dependency of packageGraph.get(packageName) ?? []) {
    if (packageGraph.has(dependency)) detectCycle(dependency, [...path, packageName], visited);
  }
}
