import { describe, expect, it, vi } from "vitest";
import { testAppConfig } from "./fixtures/appConfig";

const cornerStorageKey = `${testAppConfig.storageKeyPrefix}.corners`;
const cornerRadiusStorageKey = `${testAppConfig.storageKeyPrefix}.cornerRadius`;

describe("useCornerStyle", () => {
  it.each([
    { platform: "macos", style: "round", radius: 8 },
    { platform: "windows", style: "smooth", radius: 16 },
    { platform: "linux", style: "smooth", radius: 16 },
  ] as const)("$platform 使用对应平台的默认圆角", async ({ platform, style, radius }) => {
    window.__LILIA_NATIVE_PLATFORM__ = platform;
    vi.resetModules();

    const { setLiliaAppConfig, useCornerStyle } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const { cornerRadius, cornerStyle } = useCornerStyle();

    expect(cornerStyle.value).toBe(style);
    expect(cornerRadius.value).toBe(radius);
    expect(document.documentElement.dataset.corners).toBe(style);
    expect(document.documentElement.style.getPropertyValue("--app-corner-radius")).toBe(`${radius}px`);
    expect(localStorage.getItem(cornerStorageKey)).toBe(style);
    expect(localStorage.getItem(cornerRadiusStorageKey)).toBe(String(radius));
  });

  it("从 localStorage 恢复普通圆角和半径并写入 html", async () => {
    localStorage.setItem(cornerStorageKey, "round");
    localStorage.setItem(cornerRadiusStorageKey, "14");
    vi.resetModules();

    const { setLiliaAppConfig, useCornerStyle } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const { cornerRadius, cornerStyle } = useCornerStyle();

    expect(cornerStyle.value).toBe("round");
    expect(cornerRadius.value).toBe(14);
    expect(document.documentElement.dataset.corners).toBe("round");
    expect(document.documentElement.style.getPropertyValue("--app-corner-radius")).toBe("14px");
  });

  it("setCornerStyle 和 setCornerRadius 会同步更新 html 与 localStorage", async () => {
    vi.resetModules();
    const { setLiliaAppConfig, useCornerStyle } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const { cornerRadius, cornerStyle, setCornerRadius, setCornerStyle } = useCornerStyle();

    setCornerStyle("round");
    setCornerRadius(12);

    expect(cornerStyle.value).toBe("round");
    expect(cornerRadius.value).toBe(12);
    expect(document.documentElement.dataset.corners).toBe("round");
    expect(document.documentElement.style.getPropertyValue("--app-corner-radius")).toBe("12px");
    expect(localStorage.getItem(cornerStorageKey)).toBe("round");
    expect(localStorage.getItem(cornerRadiusStorageKey)).toBe("12");
  });

  it("圆角半径会限制在可用范围内", async () => {
    vi.resetModules();
    const { setLiliaAppConfig, useCornerStyle } = await import("@lilia/ui");
    setLiliaAppConfig(testAppConfig);
    const { cornerRadius, setCornerRadius } = useCornerStyle();

    setCornerRadius(999);
    expect(cornerRadius.value).toBe(20);

    setCornerRadius(-1);
    expect(cornerRadius.value).toBe(0);
  });
});
