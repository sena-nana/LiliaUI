import axe from "axe-core";
import { render } from "@testing-library/vue";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import { NanaButton, NanaCheckbox, NanaFormField, NanaInput, NanaProgress, NanaUIProvider } from "@lilia/nana-ui";
import { NanaAppShell } from "@lilia/nana-ui/shell";

const axeOptions = { rules: { "color-contrast": { enabled: false } } };

describe("NanaUI accessibility", () => {
  it("has no structural accessibility violations across form and progress states", async () => {
    const view = render(defineComponent({
      components: { NanaButton, NanaCheckbox, NanaFormField, NanaInput, NanaProgress, NanaUIProvider },
      template: `
        <NanaUIProvider>
          <main>
            <h1>设置</h1>
            <NanaFormField label="名称" v-slot="field">
              <NanaInput :aria-describedby="field.describedBy" aria-label="名称" />
            </NanaFormField>
            <NanaCheckbox label="自动启动" />
            <NanaProgress label="正在导入" :value="45" cancellable />
            <NanaButton variant="primary">应用</NanaButton>
          </main>
        </NanaUIProvider>
      `,
    }));
    const result = await axe.run(view.container, axeOptions);
    expect(result.violations).toEqual([]);
  });

  it("keeps shell navigation and landmarks accessible", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<article><h1>首页</h1></article>" } }],
    });
    await router.push("/");
    await router.isReady();
    const view = render(NanaAppShell, {
      props: { navigation: [{ id: "home", label: "首页", href: "/", active: true }] },
      global: { plugins: [router] },
    });
    const result = await axe.run(view.container, axeOptions);
    expect(result.violations).toEqual([]);
  });
});
