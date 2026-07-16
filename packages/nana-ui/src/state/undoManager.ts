import type { MaybePromise } from "@lilia/ui-contract";

export interface UndoCommand {
  id: string;
  execute: () => MaybePromise<void>;
  undo: () => MaybePromise<void>;
  redo?: () => MaybePromise<void>;
}

export function createUndoManager(limit = 50) {
  const undoStack: UndoCommand[] = [];
  const redoStack: UndoCommand[] = [];
  return {
    get canUndo() { return undoStack.length > 0; },
    get canRedo() { return redoStack.length > 0; },
    async execute(command: UndoCommand) {
      await command.execute();
      undoStack.push(command);
      if (undoStack.length > limit) undoStack.shift();
      redoStack.length = 0;
    },
    async undo() {
      const command = undoStack.pop();
      if (!command) return false;
      try {
        await command.undo();
        redoStack.push(command);
        return true;
      } catch (error) {
        undoStack.push(command);
        throw error;
      }
    },
    async redo() {
      const command = redoStack.pop();
      if (!command) return false;
      try {
        await (command.redo ?? command.execute)();
        undoStack.push(command);
        return true;
      } catch (error) {
        redoStack.push(command);
        throw error;
      }
    },
    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
  };
}
