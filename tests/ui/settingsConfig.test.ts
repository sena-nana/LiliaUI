import { fireEvent, render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import {
  SettingsCollapsibleCard,
  normalizeSettingsTab,
  setLiliaAppConfig,
  type LiliaAppConfig,
} from "@lilia/ui";
import LiliaSettingsPage from "../../packages/ui/src/pages/SettingsPage.vue";
import { testAppConfig } from "./fixtures/appConfig";

const customConfig = {
  ...testAppConfig,
  settings: {
    aliases: { plugins: "plugin-skills" },
    defaultTab: "appearance",
    fullPageTabs: ["plugin-skills"],
    tabs: [
      { key: "appearance", label: "外观", icon: "palette" },
      { key: "plugin-skills", label: "技能", icon: "sparkles", props: { section: "skills" } },
    ],
    sections: {
      appearance: { template: "<div>appearance section</div>" },
      "plugin-skills": {
        props: ["section"],
        template: "<main>plugin {{ section }}</main>",
      },
    },
  },
} satisfies LiliaAppConfig;

describe("settings config", () => {
  it("normalizes aliases and renders full-page configured sections with props", async () => {
    setLiliaAppConfig(customConfig);
    expect(normalizeSettingsTab("plugins")).toBe("plugin-skills");
    expect(normalizeSettingsTab("missing")).toBe("appearance");

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/settings", component: LiliaSettingsPage }],
    });
    await router.push("/settings?tab=plugins");
    await router.isReady();
    const view = render(LiliaSettingsPage, {
      global: {
        plugins: [router],
      },
    });

    expect(await view.findByText("plugin skills")).toBeInTheDocument();
    expect(view.queryByText("偏好设置会保存到本地。")).not.toBeInTheDocument();
  });
});

describe("SettingsCollapsibleCard", () => {
  it("toggles details by click and keyboard", async () => {
    const view = render(defineComponent({
      components: { SettingsCollapsibleCard },
      data: () => ({ expanded: false }),
      template: `
        <SettingsCollapsibleCard
          v-model:expanded="expanded"
          controls-id="details"
          toggle-agent-id="settings.demo.toggle"
          expand-label="展开"
          collapse-label="收起"
          aria-label="演示卡片"
        >
          <template #summary>摘要</template>
          详情
        </SettingsCollapsibleCard>
      `,
    }));

    const toggle = view.getByRole("button", { name: "展开" });
    expect(view.queryByText("详情")).not.toBeInTheDocument();

    await fireEvent.click(toggle);
    expect(view.getByText("详情")).toBeInTheDocument();

    await fireEvent.keyDown(view.getByRole("button", { name: "收起" }), { key: " " });
    expect(view.queryByText("详情")).not.toBeInTheDocument();
  });
});
