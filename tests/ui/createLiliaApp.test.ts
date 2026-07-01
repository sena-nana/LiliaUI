import { waitFor } from "@testing-library/vue";
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
});
