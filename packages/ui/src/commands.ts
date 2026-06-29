import type { App, InjectionKey } from "vue";

export type LiliaCommandHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;

export type LiliaCommandMap = Record<string, LiliaCommandHandler>;

export interface LiliaCommandRegistry {
  execute<TResult = unknown>(id: string, payload?: unknown): Promise<TResult>;
  has(id: string): boolean;
  register(id: string, handler: LiliaCommandHandler): () => void;
}

export const liliaCommandsKey: InjectionKey<LiliaCommandRegistry> = Symbol("liliaCommands");

export function createCommandRegistry(initial: LiliaCommandMap = {}): LiliaCommandRegistry {
  const handlers = new Map<string, LiliaCommandHandler>(Object.entries(initial));

  return {
    async execute<TResult = unknown>(id: string, payload?: unknown): Promise<TResult> {
      const handler = handlers.get(id);
      if (!handler) throw new Error(`Unknown command: ${id}`);
      return await handler(payload) as TResult;
    },
    has(id: string) {
      return handlers.has(id);
    },
    register(id: string, handler: LiliaCommandHandler) {
      handlers.set(id, handler);
      return () => {
        if (handlers.get(id) === handler) handlers.delete(id);
      };
    },
  };
}

export function installCommandRegistry(app: App, commands: LiliaCommandMap = {}) {
  app.provide(liliaCommandsKey, createCommandRegistry(commands));
}
