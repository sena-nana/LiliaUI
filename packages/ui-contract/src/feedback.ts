import type { AgentTargetProps, MaybePromise, UIStatusTone } from "./common";

export interface ToastProps extends AgentTargetProps {
  title: string;
  description?: string;
  tone?: UIStatusTone;
  dismissible?: boolean;
}

export interface ProgressProps extends AgentTargetProps {
  value?: number;
  max?: number;
  label: string;
  cancellable?: boolean;
}

export interface RecoveryAction {
  id: string;
  label: string;
  run: () => MaybePromise<void>;
}

export interface RecoveryErrorModel {
  title: string;
  impact: string;
  actions: readonly RecoveryAction[];
  technicalDetails?: string;
  traceId?: string;
}

export type SaveState = "clean" | "dirty" | "saving" | "saved" | "failed";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "failed";
export type RuntimeState = "idle" | "running" | "paused" | "stopped" | "failed";
export type OutputState = "inactive" | "starting" | "active" | "stopping" | "failed";
export type AsyncResourceState = "idle" | "loading" | "ready" | "failed";

export interface OperationalState {
  resource?: AsyncResourceState;
  connection?: ConnectionState;
  runtime?: RuntimeState;
  output?: OutputState;
  save?: SaveState;
  pendingChanges?: boolean;
}
