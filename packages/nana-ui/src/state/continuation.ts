export interface ContinuationSnapshot {
  currentStep: number;
  completedSteps: readonly number[];
  skipped: boolean;
}

export interface ContinuationAdapter {
  load: () => ContinuationSnapshot | null;
  save: (snapshot: ContinuationSnapshot) => void;
  clear: () => void;
}

export function createContinuation(adapter: ContinuationAdapter, totalSteps: number) {
  let snapshot = adapter.load() ?? { currentStep: 1, completedSteps: [], skipped: false };
  const persist = () => adapter.save(snapshot);
  return {
    get snapshot() { return { ...snapshot, completedSteps: [...snapshot.completedSteps] }; },
    complete(step: number) {
      const completedSteps = [...new Set([...snapshot.completedSteps, step])].sort((a, b) => a - b);
      snapshot = { currentStep: Math.min(totalSteps, step + 1), completedSteps, skipped: false };
      persist();
    },
    skip() { snapshot = { ...snapshot, skipped: true }; persist(); },
    resume() { snapshot = { ...snapshot, skipped: false }; persist(); return snapshot.currentStep; },
    reset() { adapter.clear(); snapshot = { currentStep: 1, completedSteps: [], skipped: false }; },
  };
}
