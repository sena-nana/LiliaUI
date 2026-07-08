import { waitFor } from "@testing-library/vue";
import { defineComponent } from "vue";
import { createMemoryHistory } from "vue-router";
import { afterEach, describe, expect, it } from "vitest";
import { createLiliaApp } from "@lilia/ui/app";
import { uninstallAgentDebugHarness } from "@lilia/ui";
import { testAppConfig } from "./fixtures/appConfig";

describe("createLiliaApp", () => {
  afterEach(() => {
    uninstallAgentDebugHarness();
  });

  it("does not install the agent debug harness by default", async () => {
    createLiliaApp({
      config: {
        ...testAppConfig,
        runtime: {
          contextMenu: false,
          globalScrollbar: false,
        },
      },
      history: createMemoryHistory(),
      routes: [],
    });

    await Promise.resolve();
    expect(window.__liliaAgentDebug).toBeUndefined();
  });

  it("installs the agent debug harness when runtime config enables it", async () => {
    createLiliaApp({
      config: {
        ...testAppConfig,
        runtime: {
          agentDebug: { maxLogEntries: 2 },
          contextMenu: false,
          globalScrollbar: false,
        },
      },
      history: createMemoryHistory(),
      routes: [],
    });

    await waitFor(() => expect(window.__liliaAgentDebug).toBeDefined());
  });

  it("mounts app overlays provided by the final application", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const Overlay = defineComponent({
      template: `<div data-testid="app-overlay">overlay</div>`,
    });
    const { app, router } = createLiliaApp({
      config: {
        ...testAppConfig,
        runtime: {
          contextMenu: false,
          globalScrollbar: false,
        },
      },
      history: createMemoryHistory(),
      overlays: [Overlay],
      routes: [],
    });

    app.mount(host);
    await router.isReady();

    expect(host.querySelector("[data-testid='app-overlay']")).toBeInTheDocument();
    app.unmount();
    host.remove();
  });
});
