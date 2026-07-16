import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { NanaButton, NanaFormField, NanaInput, NanaUIProvider } from "@lilia/nana-ui";
import { AdvancedSettingsDisclosure, ProgressiveSection, RecoveryError } from "@lilia/nana-ui/consumer";

describe("NanaUI provider and controls", () => {
  it("applies explicit policy and updates controls through shared contract props", async () => {
    const action = vi.fn();
    const view = render(defineComponent({
      components: { NanaButton, NanaFormField, NanaInput, NanaUIProvider, ProgressiveSection },
      setup() { return { action, value: ref("") }; },
      template: `
        <NanaUIProvider :policy="{ density: 'compact', advancedDisclosure: 'visible' }" theme="dark">
          <NanaFormField label="名称" hint="用于识别" error="不能为空" v-slot="field">
            <NanaInput v-model="value" :aria-describedby="field.describedBy" :invalid="field.invalid" aria-label="名称" />
          </NanaFormField>
          <ProgressiveSection level="advanced" title="高级"><span>高级内容</span></ProgressiveSection>
          <NanaButton variant="primary" @click="action">保存</NanaButton>
          <output>{{ value }}</output>
        </NanaUIProvider>
      `,
    }));

    const root = view.container.querySelector(".nana-ui");
    expect(root).toHaveAttribute("data-density", "compact");
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(screen.getByText("高级内容")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "名称" })).toHaveAttribute("aria-invalid", "true");
    await fireEvent.update(screen.getByRole("textbox", { name: "名称" }), "Nana");
    await fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("Nana", { selector: "output" })).toBeInTheDocument();
    expect(action).toHaveBeenCalledOnce();
  });

  it("keeps advanced content collapsed by policy until the user opens a disclosure", async () => {
    render(defineComponent({
      components: { AdvancedSettingsDisclosure, NanaUIProvider, ProgressiveSection },
      template: `<NanaUIProvider><ProgressiveSection level="advanced"><span>受策略控制</span></ProgressiveSection><AdvancedSettingsDisclosure><span>用户展开内容</span></AdvancedSettingsDisclosure></NanaUIProvider>`,
    }));

    expect(screen.queryByText("受策略控制")).toBeNull();
    expect(screen.queryByText("用户展开内容")).toBeNull();
    await fireEvent.click(screen.getByRole("button", { name: "高级设置" }));
    expect(screen.getByText("用户展开内容")).toBeVisible();
  });

  it("replaces reactive provider policy and restores omitted values to Nana defaults", async () => {
    const view = render(defineComponent({
      components: { NanaUIProvider },
      setup() { return { policy: ref({ density: "compact" as const }) }; },
      template: `<NanaUIProvider :policy="policy"><button @click="policy = {}">恢复默认</button></NanaUIProvider>`,
    }));

    expect(view.container.querySelector(".nana-ui")).toHaveAttribute("data-density", "compact");
    await fireEvent.click(screen.getByRole("button", { name: "恢复默认" }));
    expect(view.container.querySelector(".nana-ui")).toHaveAttribute("data-density", "comfortable");
  });

  it("runs recovery actions without exposing technical diagnostics in the UI", async () => {
    const retry = vi.fn();
    render(RecoveryError, {
      props: {
        model: {
          title: "无法完成保存",
          impact: "修改仍保留在当前页面。",
          actions: [{ id: "retry", label: "重试", run: retry }],
          technicalDetails: "storage unavailable",
          traceId: "trace-1",
        },
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.queryByText("storage unavailable")).toBeNull();
    expect(screen.queryByText("trace-1")).toBeNull();
  });
});
