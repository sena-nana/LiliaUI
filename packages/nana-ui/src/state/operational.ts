import type { OperationalState, UIStatusTone } from "@lilia/ui-contract";

export interface OperationalSummary {
  label: string;
  tone: UIStatusTone;
  announce: "polite" | "assertive";
}

export function summarizeOperationalState(state: OperationalState): OperationalSummary {
  if (state.save === "failed") return { label: "保存失败，可以重试", tone: "error", announce: "assertive" };
  if (state.connection === "failed") return { label: "连接失败，可以重新连接", tone: "error", announce: "assertive" };
  if (state.connection === "reconnecting") return { label: "正在重新连接", tone: "warning", announce: "polite" };
  if (state.save === "saving") return { label: "正在保存", tone: "info", announce: "polite" };
  if (state.pendingChanges || state.save === "dirty") return { label: "有未保存的修改", tone: "warning", announce: "polite" };
  if (state.runtime === "running") return { label: "正在运行", tone: "success", announce: "polite" };
  if (state.output === "active") return { label: "输出已开启", tone: "success", announce: "polite" };
  if (state.save === "saved") return { label: "已保存", tone: "success", announce: "polite" };
  return { label: "已就绪", tone: "neutral", announce: "polite" };
}
