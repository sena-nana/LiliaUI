import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const SOURCE_EXTENSIONS = new Set([".css", ".js", ".jsx", ".mjs", ".ts", ".tsx", ".vue"]);
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".yarn",
  "dist",
  "node_modules",
  "target",
]);

export async function readText(path, fallback = null) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function collectSourceFiles(projectRoot, roots = ["src", "tests"]) {
  const files = [];
  for (const root of roots) {
    await walk(join(projectRoot, root), projectRoot, files);
  }
  return files.sort();
}

async function walk(current, projectRoot, files) {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(path, projectRoot, files);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(relative(projectRoot, path).replaceAll("\\", "/"));
    }
  }
}

export async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}
