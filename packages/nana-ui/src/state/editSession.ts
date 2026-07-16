export interface EditSession<T> {
  readonly draft: T;
  readonly baseline: T;
  readonly dirty: boolean;
  update: (next: T) => void;
  apply: () => Promise<void>;
  cancel: () => void;
  restoreDefault: () => void;
}

export function createEditSession<T>(options: {
  initial: T;
  defaultValue: T;
  clone: (value: T) => T;
  equals: (left: T, right: T) => boolean;
  apply: (value: T) => Promise<void> | void;
}): EditSession<T> {
  let baseline = options.clone(options.initial);
  let draft = options.clone(options.initial);
  return {
    get baseline() { return options.clone(baseline); },
    get draft() { return options.clone(draft); },
    get dirty() { return !options.equals(draft, baseline); },
    update(next) { draft = options.clone(next); },
    async apply() {
      const submitted = options.clone(draft);
      await options.apply(options.clone(submitted));
      baseline = submitted;
    },
    cancel() { draft = options.clone(baseline); },
    restoreDefault() { draft = options.clone(options.defaultValue); },
  };
}
