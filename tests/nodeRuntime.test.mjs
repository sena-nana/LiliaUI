import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { enableNodeCompileCache } from "../packages/tools/src/nodeRuntime.mjs";

describe("Node 编译缓存", () => {
  it("启用 portable 缓存并传递给子进程", () => {
    const env = { ...process.env };
    delete env.NODE_DISABLE_COMPILE_CACHE;
    const runtimeUrl = pathToFileURL(resolve("packages/tools/src/nodeRuntime.mjs")).href;
    const child = spawnSync(process.execPath, [
      "--input-type=module",
      "--eval",
      `import { enableNodeCompileCache } from ${JSON.stringify(runtimeUrl)};
       const env = {};
       const result = enableNodeCompileCache(env, []);
       process.stdout.write(JSON.stringify({ directory: result.directory, env }));`,
    ], { encoding: "utf8", env });

    expect(child.stderr).toBe("");
    expect(child.status).toBe(0);
    const result = JSON.parse(child.stdout);
    expect(result.directory).toBeTruthy();
    expect(result.env.NODE_COMPILE_CACHE).toBe(result.directory);
    expect(result.env.NODE_COMPILE_CACHE_PORTABLE).toBe("1");
  });

  it("覆盖率命令禁用编译缓存", () => {
    const env = {};
    const result = enableNodeCompileCache(env, ["test", "--coverage"]);

    expect(result.directory).toBeUndefined();
    expect(env.NODE_DISABLE_COMPILE_CACHE).toBe("1");
  });
});
