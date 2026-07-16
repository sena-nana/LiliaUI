// @vitest-environment node
import { describe, expect, it } from "vitest";
import { executeUiTransaction } from "@lilia/tools/ui-preset";
import { createUiFixture, read, write } from "./uiFixture.mjs";

describe("UI transaction", () => {
  it("restores every file and lockfile when validation fails", async () => {
    const root = createUiFixture();
    write(root, "yarn.lock", "original lock\n");
    const packageBefore = read(root, "package.json");
    const plan = {
      projectRoot: root,
      git: { available: false, dirty: null, entries: [] },
      blockers: [],
      commands: [{ id: "validate", command: "fixture", args: [] }],
      operations: [
        { path: "package.json", before: packageBefore, after: "{}\n", reason: "test" },
        { path: "src/ui/new.ts", before: null, after: "export {};\n", reason: "test" },
      ],
    };

    const result = await executeUiTransaction(plan, {
      commandRunner: async () => {
        write(root, "yarn.lock", "changed lock\n");
        throw new Error("validation failed");
      },
    });

    expect(result.status).toBe("rolled_back");
    expect(result.rollback.complete).toBe(true);
    expect(read(root, "package.json")).toBe(packageBefore);
    expect(read(root, "yarn.lock")).toBe("original lock\n");
    expect(() => read(root, "src/ui/new.ts")).toThrow();
  });

  it("blocks writes on a dirty worktree unless explicitly forced", async () => {
    const root = createUiFixture();
    const before = read(root, "package.json");
    const plan = {
      projectRoot: root,
      git: { available: true, dirty: true, entries: [" M src/main.ts"] },
      blockers: [],
      commands: [],
      operations: [{ path: "package.json", before, after: "{}\n", reason: "test" }],
    };

    const result = await executeUiTransaction(plan);

    expect(result.status).toBe("blocked");
    expect(result.blockers[0].id).toBe("dirty-worktree");
    expect(read(root, "package.json")).toBe(before);
  });

  it("rolls back only files written by the transaction when preflight detects a conflict", async () => {
    const root = createUiFixture();
    write(root, "src/first.ts", "first-before\n");
    write(root, "src/concurrent.ts", "concurrent-change\n");
    const plan = {
      projectRoot: root,
      git: { available: false, dirty: null, entries: [] },
      blockers: [],
      commands: [],
      operations: [
        { path: "src/first.ts", before: "first-before\n", after: "first-after\n", reason: "test" },
        { path: "src/concurrent.ts", before: "planned-before\n", after: "planned-after\n", reason: "test" },
      ],
    };

    const result = await executeUiTransaction(plan);

    expect(result.status).toBe("rolled_back");
    expect(read(root, "src/first.ts")).toBe("first-before\n");
    expect(read(root, "src/concurrent.ts")).toBe("concurrent-change\n");
    expect(result.rollback.restored).toContain("src/first.ts");
    expect(result.rollback.restored).not.toContain("src/concurrent.ts");
  });
});
