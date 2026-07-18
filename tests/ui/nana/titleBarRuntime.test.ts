import { fireEvent, render, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NanaTitleBar } from "@lilia/nana-ui/shell";
import { createTauriNativeAppearanceAdapter } from "@lilia/nana-ui/runtime/tauri";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(async () => undefined),
  appWindow: {
    isMaximized: vi.fn(async () => false),
    onResized: vi.fn(async () => vi.fn()),
    startDragging: vi.fn(async () => undefined),
    minimize: vi.fn(async () => undefined),
    toggleMaximize: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  },
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => mocks.appWindow }));

beforeEach(() => vi.clearAllMocks());

describe("Nana desktop runtime", () => {
  it("forwards titlebar window controls", async () => {
    const view = render(NanaTitleBar, { props: { title: "Nana" } });
    await waitFor(() => expect(mocks.appWindow.onResized).toHaveBeenCalledOnce());

    await fireEvent.click(view.getByRole("button", { name: "最小化" }));
    await fireEvent.click(view.getByRole("button", { name: "最大化" }));
    await fireEvent.click(view.getByRole("button", { name: "关闭" }));

    expect(mocks.appWindow.minimize).toHaveBeenCalledOnce();
    expect(mocks.appWindow.toggleMaximize).toHaveBeenCalledOnce();
    expect(mocks.appWindow.close).toHaveBeenCalledOnce();
  });

  it("uses the shared plugin command for backdrop changes", async () => {
    const adapter = createTauriNativeAppearanceAdapter();
    await adapter.setWindowBackdrop({ mode: "mica", dark: true });

    expect(mocks.invoke).toHaveBeenCalledWith("plugin:lilia|set_window_backdrop", {
      mode: "mica",
      dark: true,
    });
  });
});
