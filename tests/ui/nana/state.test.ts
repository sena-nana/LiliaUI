import { render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAsyncTaskController, createContinuation, createEditSession, createUndoManager, initialReconnectState, reduceReconnect, summarizeOperationalState, useAutoSave } from "@lilia/nana-ui/state";

afterEach(() => vi.useRealTimers());

describe("NanaUI recovery state", () => {
  it("tracks reconnect attempts without hiding failure state", () => {
    const connecting = reduceReconnect(initialReconnectState, { type: "CONNECT" });
    const retrying = reduceReconnect(connecting, { type: "RETRY" });
    const failed = reduceReconnect(retrying, { type: "FAILED", error: new Error("offline") });
    expect(connecting.status).toBe("connecting");
    expect(retrying).toMatchObject({ status: "reconnecting", attempt: 1 });
    expect(failed).toMatchObject({ status: "failed", attempt: 1 });
    expect(summarizeOperationalState({ connection: failed.status }).tone).toBe("error");
  });

  it("executes, undoes, and redoes commands in order", async () => {
    const values: string[] = [];
    const manager = createUndoManager();
    await manager.execute({ id: "add", execute: () => { values.push("value"); }, undo: () => { values.pop(); } });
    expect(values).toEqual(["value"]);
    expect(await manager.undo()).toBe(true);
    expect(values).toEqual([]);
    expect(await manager.redo()).toBe(true);
    expect(values).toEqual(["value"]);
  });

  it("retains undo history when an undo action fails", async () => {
    const manager = createUndoManager();
    await manager.execute({
      id: "fragile",
      execute: () => {},
      undo: () => { throw new Error("busy"); },
    });
    await expect(manager.undo()).rejects.toThrow("busy");
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  it("never reports saved after an auto-save failure and supports retry", async () => {
    vi.useFakeTimers();
    const save = vi.fn()
      .mockRejectedValueOnce(new Error("disk full"))
      .mockResolvedValueOnce(undefined);
    let controller: ReturnType<typeof useAutoSave<string>> | undefined;
    render(defineComponent({
      setup() {
        controller = useAutoSave({ serialize: () => "snapshot", save, delayMs: 20 });
        return () => null;
      },
    }));
    controller?.markDirty();
    await vi.advanceTimersByTimeAsync(20);
    expect(controller?.state.value).toBe("failed");
    expect(await controller?.retry()).toBe(true);
    expect(controller?.state.value).toBe("saved");
  });

  it("supports preview, apply, cancel, and restore-default without owning persistence", async () => {
    const applied: number[] = [];
    const session = createEditSession({
      initial: { value: 2 },
      defaultValue: { value: 1 },
      clone: (value) => ({ ...value }),
      equals: (left, right) => left.value === right.value,
      apply: (value) => { applied.push(value.value); },
    });
    session.update({ value: 3 });
    expect(session.dirty).toBe(true);
    session.cancel();
    expect(session.draft).toEqual({ value: 2 });
    session.restoreDefault();
    await session.apply();
    expect(applied).toEqual([1]);
    expect(session.dirty).toBe(false);
  });

  it("keeps edits made during an asynchronous apply dirty", async () => {
    let release: (() => void) | undefined;
    const session = createEditSession({
      initial: { value: 1 },
      defaultValue: { value: 0 },
      clone: (value) => ({ ...value }),
      equals: (left, right) => left.value === right.value,
      apply: () => new Promise<void>((resolve) => { release = resolve; }),
    });
    session.update({ value: 2 });
    const applying = session.apply();
    session.update({ value: 3 });
    release?.();
    await applying;
    expect(session.baseline).toEqual({ value: 2 });
    expect(session.draft).toEqual({ value: 3 });
    expect(session.dirty).toBe(true);
  });

  it("persists onboarding continuation and cancels long tasks", async () => {
    let stored: { currentStep: number; completedSteps: readonly number[]; skipped: boolean } | null = null;
    const continuation = createContinuation({ load: () => stored, save: (value) => { stored = value; }, clear: () => { stored = null; } }, 4);
    continuation.complete(1);
    continuation.skip();
    expect(stored).toMatchObject({ currentStep: 2, completedSteps: [1], skipped: true });
    expect(continuation.resume()).toBe(2);

    const task = createAsyncTaskController<string>();
    let release: (() => void) | undefined;
    const running = task.run((signal) => new Promise<string>((resolve) => {
      release = () => resolve(signal.aborted ? "cancelled" : "done");
    }));
    task.cancel();
    release?.();
    expect(await running).toBeUndefined();
    expect(task.status.value).toBe("cancelled");
  });

  it("ignores stale progress and results when a newer task replaces a running task", async () => {
    const task = createAsyncTaskController<string>();
    let finishFirst: (() => void) | undefined;
    const first = task.run((_signal, progress) => new Promise<string>((resolve) => {
      finishFirst = () => { progress(90); resolve("stale"); };
    }));
    const second = task.run(async (_signal, progress) => {
      progress(40);
      return "current";
    });
    expect(await second).toBe("current");
    finishFirst?.();
    expect(await first).toBeUndefined();
    expect(task.result.value).toBe("current");
    expect(task.progress.value).toBe(40);
    expect(task.status.value).toBe("completed");
  });
});
