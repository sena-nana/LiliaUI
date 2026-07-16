import {
  NanaProgress,
  NanaToast,
} from "@lilia/nana-ui";
import {
  OperationalStatus,
  OperationResult,
  RecoveryError,
  UndoableActionNotice,
} from "@lilia/nana-ui/feedback";
import { h } from "vue";
import type { ComponentPerfScenario } from "../../componentScenarios";
import { click } from "./helpers";

export const nanaFeedbackScenarios: ComponentPerfScenario[] = [
  {
    name: "NanaToast",
    render: (step) => h(NanaToast, {
      title: "Saved",
      description: `Revision ${step.value + 1} is ready`,
      tone: step.value % 2 === 0 ? "success" : "info",
      agentId: "perf.nana.toast",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.toast'] button"),
  },
  {
    name: "NanaProgress",
    render: (step) => h(NanaProgress, {
      value: 30 + step.value * 10,
      max: 100,
      label: "Uploading",
      cancellable: true,
      agentId: "perf.nana.progress",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.progress'] button"),
  },
  {
    name: "OperationalStatus",
    render: (step) => h(OperationalStatus, {
      state: step.value % 2 === 0
        ? { connection: "connected", save: "clean" }
        : { connection: "reconnecting", save: "dirty", pendingChanges: true },
      agentId: "perf.nana.operational-status",
    }),
  },
  {
    name: "OperationResult",
    render: (step) => h(OperationResult, {
      title: step.value % 2 === 0 ? "Completed" : "Updated",
      description: `Processed ${step.value + 1} item`,
      tone: "success",
    }),
  },
  {
    name: "RecoveryError",
    render: (step) => h(RecoveryError, {
      agentId: "perf.nana.recovery",
      model: {
        title: "Unable to connect",
        impact: `Attempt ${step.value + 1} did not finish`,
        actions: [
          { id: "retry", label: "Try again", run: () => undefined },
          { id: "cancel", label: "Cancel", run: () => undefined },
        ],
        technicalDetails: "Connection closed before completion",
      },
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.recovery.retry']"),
  },
  {
    name: "UndoableActionNotice",
    render: (step) => h(UndoableActionNotice, {
      message: `Removed item ${step.value + 1}`,
      timeoutMs: 60_000,
      agentId: "perf.nana.undo",
    }),
    interact: (root) => click(root, "[data-agent-id='perf.nana.undo'] button"),
  },
];
