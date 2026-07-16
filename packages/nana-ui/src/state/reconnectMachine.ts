import type { ConnectionState } from "@lilia/ui-contract";

export interface ReconnectState {
  status: ConnectionState;
  attempt: number;
  error?: unknown;
}

export type ReconnectEvent =
  | { type: "CONNECT" }
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "RETRY" }
  | { type: "FAILED"; error: unknown };

export const initialReconnectState: ReconnectState = { status: "disconnected", attempt: 0 };

export function reduceReconnect(state: ReconnectState, event: ReconnectEvent): ReconnectState {
  switch (event.type) {
    case "CONNECT":
      return { status: "connecting", attempt: 0 };
    case "CONNECTED":
      return { status: "connected", attempt: 0 };
    case "DISCONNECTED":
      return { status: "disconnected", attempt: state.attempt };
    case "RETRY":
      return { status: "reconnecting", attempt: state.attempt + 1 };
    case "FAILED":
      return { status: "failed", attempt: state.attempt, error: event.error };
  }
}
