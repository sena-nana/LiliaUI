import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";

const root = process.cwd();
const packageManager = "pnpm@11.14.0";
const ignored = new Set([
  ".git",
  ".idea",
  ".vscode",
  "node_modules",
  "target",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vite",
  ".cache",
  ".venv",
  "vendor",
]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".json5",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".vue",
  ".yaml",
  ".yml",
]);
const workspaceSettings = new Map();

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function migrateCommand(command) {
  return command
    .replace(/\byarn\s+--cwd\s+([^\s]+)\s+/g, "pnpm --dir $1 ")
    .replace(
      /\byarn\s+workspaces\s+foreach\s+-Ap\s+run\s+([\w:-]+)/g,
      "pnpm -r --parallel --if-present run $1",
    )
    .replace(/\byarn\s+workspace\s+([^\s]+)\s+/g, "pnpm --filter $1 ")
    .replace(/\bcorepack\s+yarn\s+install\s+--immutable\b/g, "pnpm install --frozen-lockfile")
    .replace(/\byarn\s+install\s+--immutable(?:-cache)?\b/g, "pnpm install --frozen-lockfile")
    .replace(/\byarn\s+install\b/g, "pnpm install")
    .replace(/\byarn\s+node\s+/g, "node ")
    .replace(/\byarn\s+dlx\b/g, "pnpm dlx")
    .replace(/\byarn\s+exec\b/g, "pnpm exec")
    .replace(/\byarn\s+npm\s+audit\b/g, "pnpm audit")
    .replace(/\byarn\s+run\s+/g, "pnpm run ")
    .replace(/\byarn\s+/g, "pnpm ")
    .replace(/\bcorepack\s+pnpm\s+/g, "pnpm ");
}

function migrateGitDependency(specifier) {
  if (typeof specifier !== "string") return specifier;
  const match = /^(github:[^#]+)#workspace=([^&]+)&commit=([0-9a-f]{40})$/i.exec(specifier);
  if (!match) return specifier;
  const packageDirectory = decodeURIComponent(match[2]).split("/").at(-1);
  return `${match[1]}#${match[3]}&path:/packages/${packageDirectory}`;
}

function migrateManifest(path) {
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  let changed = false;

  if (typeof manifest.packageManager === "string" && manifest.packageManager.startsWith("yarn@")) {
    manifest.packageManager = packageManager;
    manifest.engines ??= {};
    manifest.engines.pnpm = ">=11.0.0 <12";
    changed = true;
  }

  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    if (!manifest[field]) continue;
    for (const [name, specifier] of Object.entries(manifest[field])) {
      const migrated = migrateGitDependency(specifier);
      if (migrated !== specifier) {
        manifest[field][name] = migrated;
        changed = true;
      }
    }
  }

  if (manifest.scripts) {
    for (const [name, command] of Object.entries(manifest.scripts)) {
      if (typeof command !== "string") continue;
      const migrated = migrateCommand(command);
      if (migrated !== command) {
        manifest.scripts[name] = migrated;
        changed = true;
      }
    }
  }

  const settings = workspaceSettings.get(dirname(path)) ?? { packages: [], overrides: {} };
  const workspaces = Array.isArray(manifest.workspaces)
    ? manifest.workspaces
    : Array.isArray(manifest.workspaces?.packages)
      ? manifest.workspaces.packages
      : [];
  settings.packages = [...new Set([...settings.packages, ...workspaces])];

  if (manifest.resolutions && typeof manifest.resolutions === "object") {
    for (const [key, value] of Object.entries(manifest.resolutions)) {
      settings.overrides[key.replace(/@npm:/g, "@")] =
        typeof value === "string" ? value.replace(/^npm:(?=\d)/, "") : value;
    }
    delete manifest.resolutions;
    changed = true;
  }
  workspaceSettings.set(dirname(path), settings);

  if (changed) writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeWorkspaceFile(directory, settings) {
  if (!settings.packages.length && !Object.keys(settings.overrides).length) return;
  const path = join(directory, "pnpm-workspace.yaml");
  if (existsSync(path)) return;
  const lines = [];
  if (settings.packages.length) {
    lines.push("packages:");
    for (const pattern of settings.packages) lines.push(`  - ${JSON.stringify(String(pattern))}`);
  }
  if (Object.keys(settings.overrides).length) {
    if (lines.length) lines.push("");
    lines.push("overrides:");
    for (const [key, value] of Object.entries(settings.overrides)) {
      lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))}`);
    }
  }
  writeFileSync(path, `${lines.join("\n")}\n`);
}

function removeCorepackSteps(source) {
  const lines = source.split("\n");
  const output = [];
  for (let index = 0; index < lines.length; ) {
    const match = /^(\s*)-\s+name:\s*(.+?)\s*$/.exec(lines[index]);
    if (!match || !/corepack/i.test(match[2])) {
      output.push(lines[index]);
      index += 1;
      continue;
    }
    const indent = match[1];
    index += 1;
    while (index < lines.length && !lines[index].startsWith(`${indent}- `)) index += 1;
  }
  return output.join("\n");
}

function injectPnpmSetup(source) {
  if (source.includes("pnpm/action-setup@")) return source;
  const direct = /^(\s*)-\s+uses:\s+actions\/setup-node@([^\n]+)$/m;
  if (direct.test(source)) {
    return source.replace(
      direct,
      (_, indent, version) =>
        `${indent}- name: Set up pnpm\n${indent}  uses: pnpm/action-setup@v4\n${indent}  with:\n${indent}    version: 11.14.0\n\n${indent}- uses: actions/setup-node@${version}`,
    );
  }
  const named = /^(\s*)-\s+name:\s+([^\n]*Node[^\n]*)\n(\s*)uses:\s+actions\/setup-node@([^\n]+)$/mi;
  if (named.test(source)) {
    return source.replace(
      named,
      (_, indent, name, usesIndent, version) =>
        `${indent}- name: Set up pnpm\n${indent}  uses: pnpm/action-setup@v4\n${indent}  with:\n${indent}    version: 11.14.0\n\n${indent}- name: ${name}\n${usesIndent}uses: actions/setup-node@${version}`,
    );
  }
  return source;
}

for (const path of walk(root).filter((file) => basename(file) === "package.json")) {
  migrateManifest(path);
}
for (const [directory, settings] of workspaceSettings) writeWorkspaceFile(directory, settings);

const oldAction = join(root, ".github/actions/setup-node-yarn");
const newAction = join(root, ".github/actions/setup-node-pnpm");
if (existsSync(oldAction) && !existsSync(newAction)) {
  mkdirSync(dirname(newAction), { recursive: true });
  renameSync(oldAction, newAction);
}
if (existsSync(newAction)) {
  writeFileSync(
    join(newAction, "action.yml"),
    `name: Setup Node and pnpm\ndescription: Install the repository Node baseline and pinned pnpm\n\ninputs:\n  working-directory:\n    description: Directory containing package.json and pnpm-lock.yaml\n    default: .\n\nruns:\n  using: composite\n  steps:\n    - name: Set up pnpm\n      uses: pnpm/action-setup@v4\n      with:\n        version: 11.14.0\n\n    - name: Set up Node.js\n      uses: actions/setup-node@v6\n      with:\n        node-version-file: \${{ inputs.working-directory }}/.node-version\n        cache: pnpm\n        cache-dependency-path: \${{ inputs.working-directory }}/pnpm-lock.yaml\n\n    - name: Enable the Node compile cache\n      shell: bash\n      run: |\n        echo "NODE_COMPILE_CACHE=\${RUNNER_TEMP}/node-compile-cache" >> "\${GITHUB_ENV}"\n        echo "NODE_COMPILE_CACHE_PORTABLE=1" >> "\${GITHUB_ENV}"\n\n    - name: Install dependencies\n      shell: bash\n      working-directory: \${{ inputs.working-directory }}\n      env:\n        NODE_COMPILE_CACHE: \${{ runner.temp }}/node-compile-cache\n        NODE_COMPILE_CACHE_PORTABLE: "1"\n      run: pnpm install --frozen-lockfile\n`,
  );
}

for (const path of walk(root)) {
  const fileName = basename(path);
  if (["package.json", "yarn.lock", "pnpm-lock.yaml"].includes(fileName)) continue;
  if (!textExtensions.has(extname(path).toLowerCase()) && fileName !== ".gitignore") continue;
  if (statSync(path).size > 1_000_000) continue;

  const source = readFileSync(path, "utf8");
  let migrated = source
    .replaceAll("yarn.lock", "pnpm-lock.yaml")
    .replaceAll("setup-node-yarn", "setup-node-pnpm")
    .replaceAll("requiredYarnVersion", "requiredPnpmVersion")
    .replaceAll("yarnMatch", "pnpmMatch")
    .replaceAll("yarnVersion", "pnpmVersion")
    .replaceAll("yarnMajor", "pnpmMajor")
    .replaceAll("\\byarn\\/", "\\bpnpm\\/")
    .replace(/\bpnpmMajor\s*>=\s*4\b/g, "pnpmMajor >= 11");
  migrated = migrateCommand(migrated).replace(/\bYarn\b/g, "pnpm").replace(/\byarn\b/g, "pnpm");

  const normalized = relative(root, path).replaceAll("\\", "/");
  if (normalized.startsWith(".github/workflows/")) {
    migrated = injectPnpmSetup(removeCorepackSteps(migrated));
  }
  if (migrated !== source) writeFileSync(path, migrated);
}

for (const path of walk(root).filter((file) => basename(file) === ".gitignore")) {
  const lines = readFileSync(path, "utf8")
    .split("\n")
    .filter(
      (line) =>
        !/^\s*\.yarn(?:\/|$)/.test(line) &&
        !/^\s*\.pnp(?:\.|$)/.test(line) &&
        !/^\s*yarn-(?:error|debug)\.log/.test(line),
    );
  if (!lines.some((line) => line.trim() === "pnpm-debug.log*")) lines.push("pnpm-debug.log*");
  writeFileSync(path, `${lines.join("\n").replace(/\n+$/, "")}\n`);
}

rmSync(join(root, ".yarn"), { recursive: true, force: true });
rmSync(join(root, ".yarnrc.yml"), { force: true });
rmSync(join(root, ".pnp.cjs"), { force: true });
rmSync(join(root, ".pnp.js"), { force: true });
