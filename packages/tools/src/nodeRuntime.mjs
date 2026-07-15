import { enableCompileCache } from "node:module";

export function enableNodeCompileCache(env = process.env, argv = process.argv.slice(2)) {
  if (env.NODE_DISABLE_COMPILE_CACHE === "1" || usesCoverage(argv)) {
    env.NODE_DISABLE_COMPILE_CACHE = "1";
    return { directory: undefined };
  }

  const result = enableCompileCache({ portable: true });
  if (result.directory) {
    env.NODE_COMPILE_CACHE = result.directory;
    env.NODE_COMPILE_CACHE_PORTABLE = "1";
  }
  return result;
}

function usesCoverage(argv) {
  return argv.some((arg) => arg === "--coverage" || arg.startsWith("--coverage="));
}
