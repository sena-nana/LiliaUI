export type Unlisten = () => void;
export type UnlistenInstaller = () => Promise<Unlisten>;

export function runUnlistenFns(unlisteners: Iterable<Unlisten | null | undefined>) {
  for (const unlisten of unlisteners) {
    try {
      unlisten?.();
    } catch (err) {
      console.error("[event-listeners] unlisten failed", err);
    }
  }
}

export function addDomEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): Unlisten;
export function addDomEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): Unlisten;
export function addDomEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): Unlisten;
export function addDomEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): Unlisten {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

export async function installUnlistenFns(installers: UnlistenInstaller[]): Promise<Unlisten[]> {
  const unlisteners: Unlisten[] = [];
  try {
    for (const install of installers) {
      unlisteners.push(await install());
    }
  } catch (err) {
    runUnlistenFns([...unlisteners].reverse());
    throw err;
  }
  return unlisteners;
}

export async function installCombinedUnlisten(installers: UnlistenInstaller[]): Promise<Unlisten> {
  const unlisteners = await installUnlistenFns(installers);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    runUnlistenFns(unlisteners.splice(0).reverse());
  };
}
