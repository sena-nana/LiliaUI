import type { App, InjectionKey } from "vue";

export type CommandHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;

export type CommandMap = Record<string, CommandHandler>;

export interface CommandRegistry {
  execute<TResult = unknown>(id: string, payload?: unknown): Promise<TResult>;
  has(id: string): boolean;
  register(id: string, handler: CommandHandler): () => void;
}

export const commandsKey: InjectionKey<CommandRegistry> = Symbol("uiCommands");

export function createCommandRegistry(initial: CommandMap = {}): CommandRegistry {
  const handlers = new Map<string, CommandHandler>(Object.entries(initial));
  return {
    async execute<TResult = unknown>(id: string, payload?: unknown): Promise<TResult> {
      const handler = handlers.get(id);
      if (!handler) throw new Error(`Unknown command: ${id}`);
      return await handler(payload) as TResult;
    },
    has: (id) => handlers.has(id),
    register(id, handler) {
      handlers.set(id, handler);
      return () => { if (handlers.get(id) === handler) handlers.delete(id); };
    },
  };
}

export function installCommandRegistry(app: App, commands: CommandMap = {}): CommandRegistry {
  const registry = createCommandRegistry(commands);
  app.provide(commandsKey, registry);
  return registry;
}

export {
  commandsKey as liliaCommandsKey,
  type CommandHandler as LiliaCommandHandler,
  type CommandMap as LiliaCommandMap,
  type CommandRegistry as LiliaCommandRegistry,
};
