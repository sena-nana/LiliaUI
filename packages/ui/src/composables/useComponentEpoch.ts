import { onBeforeUnmount } from "vue";

export interface ComponentEpoch {
  assertAlive: (epoch?: number) => boolean;
  invalidate: () => void;
  nextEpoch: () => number;
}

export function withComponentEpoch(): ComponentEpoch {
  let epoch = 0;
  let alive = true;

  onBeforeUnmount(() => {
    alive = false;
    epoch += 1;
  });

  return {
    assertAlive(value?: number) {
      return alive && (value === undefined || value === epoch);
    },
    invalidate() {
      epoch += 1;
    },
    nextEpoch() {
      epoch += 1;
      return epoch;
    },
  };
}
