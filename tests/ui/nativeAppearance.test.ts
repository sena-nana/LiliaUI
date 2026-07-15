import { fireEvent, render, waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testAppConfig } from "./fixtures/appConfig";

const invoke = vi.fn(async () => undefined);

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

beforeEach(() => {
  localStorage.clear();
  invoke.mockReset();
  invoke.mockResolvedValue(undefined);
  delete window.__LILIA_NATIVE_PLATFORM__;
});

describe("useNativeAppearance", () => {
  it("按平台归一化材质值并安全回退未知平台", async () => {
    vi.resetModules();
    const { normalizeBackdropMode, resolveNativePlatform } = await import("@lilia/ui");

    expect(resolveNativePlatform("macos")).toBe("macos");
    expect(resolveNativePlatform("other")).toBe("linux");
    expect(normalizeBackdropMode("acrylic", "macos")).toBe("system");
    expect(normalizeBackdropMode("system", "windows")).toBe("mica");
    expect(normalizeBackdropMode("acrylic", "windows")).toBe("acrylic");
    expect(normalizeBackdropMode("mica", "linux")).toBe("solid");
  });

  it("读取 Windows 应用默认值并同步 DOM、存储和原生材质", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance } = await import("@lilia/ui");
    setLiliaAppConfig({
      ...testAppConfig,
      appearance: {
        backdropOpacity: 0.7,
        backdropTarget: "main",
        platformDefaults: { windows: { backdropMode: "acrylic" } },
      },
    });

    const appearance = useNativeAppearance();

    expect(appearance.platform).toBe("windows");
    expect(appearance.backdropMode.value).toBe("acrylic");
    expect(appearance.backdropOpacity.value).toBe(0.7);
    expect(appearance.backdropTarget.value).toBe("main");
    expect(appearance.titlebarFollowsSidebar.value).toBe(true);
    expect(document.documentElement.dataset.platform).toBe("windows");
    expect(document.documentElement.dataset.backdrop).toBe("acrylic");
    expect(document.documentElement.dataset.backdropTarget).toBe("main");
    expect(document.documentElement.dataset.titlebarFollowsSidebar).toBe("true");
    expect(document.documentElement.style.getPropertyValue("--lilia-backdrop-opacity")).toBe("0.7");
    expect(localStorage.getItem("lilia-ui-test.backdropMode")).toBe("acrylic");
    expect(localStorage.getItem("lilia-ui-test.backdropOpacity")).toBe("0.7");
    expect(localStorage.getItem("lilia-ui-test.backdropTarget")).toBe("main");
    expect(localStorage.getItem("lilia-ui-test.titlebarFollowsSidebar")).toBe("true");
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("plugin:lilia|set_window_backdrop", {
        mode: "acrylic",
        dark: true,
      });
    });
  });

  it("恢复持久化设置并限制不透明度范围", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "macos";
    localStorage.setItem("lilia-ui-test.backdropMode", "mica");
    localStorage.setItem("lilia-ui-test.backdropOpacity", "2");
    localStorage.setItem("lilia-ui-test.backdropTarget", "main");
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const appearance = useNativeAppearance();

    expect(appearance.backdropMode.value).toBe("system");
    expect(appearance.backdropOpacity.value).toBe(0.92);
    expect(appearance.backdropTarget.value).toBe("main");

    appearance.setBackdropOpacity(0);
    expect(appearance.backdropOpacity.value).toBe(0.28);
    expect(document.documentElement.style.getPropertyValue("--lilia-backdrop-opacity")).toBe("0.28");
  });

  it("缺少或非法目标值时使用应用默认值，切换目标不会重新调用原生材质", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    localStorage.setItem("lilia-ui-test.backdropTarget", "invalid");
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance } = await import("@lilia/ui");
    setLiliaAppConfig({
      ...testAppConfig,
      appearance: { backdropTarget: "main" },
    });
    const appearance = useNativeAppearance();
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));

    expect(appearance.backdropTarget.value).toBe("main");
    appearance.setBackdropTarget("sidebar");

    expect(appearance.backdropTarget.value).toBe("sidebar");
    expect(document.documentElement.dataset.backdropTarget).toBe("sidebar");
    expect(localStorage.getItem("lilia-ui-test.backdropTarget")).toBe("sidebar");
    await Promise.resolve();
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("应用未配置透明区域时默认使用侧边栏", async () => {
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);

    const appearance = useNativeAppearance();

    expect(appearance.backdropTarget.value).toBe("sidebar");
    expect(document.documentElement.dataset.backdropTarget).toBe("sidebar");
    expect(localStorage.getItem("lilia-ui-test.backdropTarget")).toBe("sidebar");
  });

  it("标题栏默认跟随侧边栏并恢复有效的应用或本地偏好", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    vi.resetModules();
    let ui = await import("@lilia/ui");
    ui.setLiliaAppConfig({
      ...testAppConfig,
      appearance: { titlebarFollowsSidebar: false },
    });
    let appearance = ui.useNativeAppearance();

    expect(appearance.titlebarFollowsSidebar.value).toBe(false);
    expect(document.documentElement.dataset.titlebarFollowsSidebar).toBe("false");

    appearance.setTitlebarFollowsSidebar(true);
    expect(localStorage.getItem("lilia-ui-test.titlebarFollowsSidebar")).toBe("true");

    localStorage.setItem("lilia-ui-test.titlebarFollowsSidebar", "invalid");
    vi.resetModules();
    ui = await import("@lilia/ui");
    ui.setLiliaAppConfig(testAppConfig);
    appearance = ui.useNativeAppearance();
    expect(appearance.titlebarFollowsSidebar.value).toBe(true);

    localStorage.setItem("lilia-ui-test.titlebarFollowsSidebar", "false");
    vi.resetModules();
    ui = await import("@lilia/ui");
    ui.setLiliaAppConfig(testAppConfig);
    appearance = ui.useNativeAppearance();
    expect(appearance.titlebarFollowsSidebar.value).toBe(false);
    expect(document.documentElement.dataset.titlebarFollowsSidebar).toBe("false");
  });

  it("仅在 Windows Mica 下随主题重新应用深浅效果", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance, useTheme } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const appearance = useNativeAppearance();
    const { setTheme } = useTheme();
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));

    setTheme("light");
    await waitFor(() => {
      expect(invoke).toHaveBeenLastCalledWith("plugin:lilia|set_window_backdrop", {
        mode: "mica",
        dark: false,
      });
    });

    appearance.setBackdropMode("acrylic");
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(3));
    setTheme("dark");
    await Promise.resolve();
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it("合并快速连续切换并保证最终原生状态胜出", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    let releaseInitial!: () => void;
    invoke.mockImplementationOnce(() => new Promise<void>((resolve) => {
      releaseInitial = resolve;
    }));
    vi.resetModules();
    const { setLiliaAppConfig, useNativeAppearance } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const appearance = useNativeAppearance();
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));

    appearance.setBackdropMode("acrylic");
    appearance.setBackdropMode("solid");
    appearance.setBackdropMode("mica");
    releaseInitial();

    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
    expect(invoke).toHaveBeenLastCalledWith("plugin:lilia|set_window_backdrop", {
      mode: "mica",
      dark: true,
    });
  });
});

describe("LiliaAppearanceSection", () => {
  it("Windows 显示平台材质选项并在实色模式禁用透明度", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "windows";
    vi.resetModules();
    const { LiliaAppearanceSection, setLiliaAppConfig } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const view = render(LiliaAppearanceSection);

    expect(view.getByRole("radio", { name: "Mica" })).toHaveAttribute(
      "data-agent-id",
      "settings.appearance.backdrop.mica",
    );
    expect(view.getByRole("radio", { name: "Acrylic" })).toBeInTheDocument();
    const sidebarTarget = view.getByRole("radio", { name: "侧边栏" });
    const mainTarget = view.getByRole("radio", { name: "主内容区" });
    const titlebarFollow = view.getByRole("switch", { name: "标题栏跟随侧边栏透明" });
    expect(sidebarTarget).toHaveAttribute(
      "data-agent-id",
      "settings.appearance.backdrop-target.sidebar",
    );
    expect(mainTarget).toHaveAttribute(
      "data-agent-id",
      "settings.appearance.backdrop-target.main",
    );
    expect(titlebarFollow).toHaveAttribute(
      "data-agent-id",
      "settings.appearance.titlebar-follow-sidebar",
    );
    expect(titlebarFollow).toBeChecked();
    expect(titlebarFollow).not.toBeDisabled();
    await fireEvent.click(titlebarFollow);
    expect(titlebarFollow).not.toBeChecked();
    expect(document.documentElement.dataset.titlebarFollowsSidebar).toBe("false");
    expect(localStorage.getItem("lilia-ui-test.titlebarFollowsSidebar")).toBe("false");

    await fireEvent.click(mainTarget);
    expect(mainTarget).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.backdropTarget).toBe("main");
    expect(titlebarFollow).toBeDisabled();
    expect(titlebarFollow).not.toBeChecked();
    const opacity = view.getByRole("slider", { name: "材质不透明度" });
    expect(opacity).toHaveValue("64");
    expect(opacity).toHaveAttribute("data-agent-id", "settings.appearance.backdrop-opacity");

    await fireEvent.update(opacity, "70");
    expect(document.documentElement.style.getPropertyValue("--lilia-backdrop-opacity")).toBe("0.7");
    expect(localStorage.getItem("lilia-ui-test.backdropOpacity")).toBe("0.7");

    await fireEvent.click(view.getByRole("radio", { name: "实色" }));
    expect(opacity).toBeDisabled();
    expect(sidebarTarget).toBeDisabled();
    expect(mainTarget).toBeDisabled();
    expect(titlebarFollow).toBeDisabled();
    expect(titlebarFollow).not.toBeChecked();
    expect(view.getByText(/切回透明材质后会恢复当前数值/)).toBeInTheDocument();
    expect(view.getByText(/切回透明材质后会恢复当前选择/)).toBeInTheDocument();
  });

  it("macOS 不暴露 Windows 材质名称，Linux 隐藏原生材质设置", async () => {
    window.__LILIA_NATIVE_PLATFORM__ = "macos";
    vi.resetModules();
    let ui = await import("@lilia/ui");
    ui.setLiliaAppConfig(testAppConfig);
    const macView = render(ui.LiliaAppearanceSection);

    expect(macView.getByRole("radio", { name: "系统透明" })).toBeInTheDocument();
    expect(macView.getByRole("radiogroup", { name: "透明区域" })).toBeInTheDocument();
    expect(macView.getByRole("switch", { name: "标题栏跟随侧边栏透明" }))
      .toBeInTheDocument();
    expect(macView.queryByRole("radio", { name: "Mica" })).not.toBeInTheDocument();
    macView.unmount();

    window.__LILIA_NATIVE_PLATFORM__ = "linux";
    vi.resetModules();
    ui = await import("@lilia/ui");
    ui.setLiliaAppConfig(testAppConfig);
    const linuxView = render(ui.LiliaAppearanceSection);

    expect(linuxView.queryByRole("radiogroup", { name: "窗口材质" })).not.toBeInTheDocument();
    expect(linuxView.queryByRole("radiogroup", { name: "透明区域" })).not.toBeInTheDocument();
    expect(linuxView.queryByRole("slider", { name: "材质不透明度" })).not.toBeInTheDocument();
    expect(linuxView.queryByRole("switch", { name: "标题栏跟随侧边栏透明" }))
      .not.toBeInTheDocument();
  });
});
