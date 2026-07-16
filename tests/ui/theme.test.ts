import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { testAppConfig } from "./fixtures/appConfig";

const themeStorageKey = `${testAppConfig.storageKeyPrefix}.theme`;
const tokensCss = readFileSync(resolve("packages/ui/src/styles/tokens.css"), "utf8");

function readCustomProperty(blockSelector: string, property: string) {
  const block = tokensCss.match(new RegExp(`${blockSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
  return block.match(new RegExp(`${property}\\s*:\\s*([^;]+);`))?.[1].trim();
}

describe("useTheme", () => {
  it("从 localStorage 恢复主题并写入 html data-theme", async () => {
    localStorage.setItem(themeStorageKey, "light");
    vi.resetModules();

    const { setLiliaUiConfig } = await import("@lilia/ui/shell");
    const { useTheme } = await import("@lilia/ui/composables/useTheme");
    setLiliaUiConfig(testAppConfig);
    const { theme } = useTheme();

    expect(theme.value).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("setTheme 会同步更新 data-theme 和 localStorage", async () => {
    vi.resetModules();
    const { setLiliaUiConfig } = await import("@lilia/ui/shell");
    const { useTheme } = await import("@lilia/ui/composables/useTheme");
    setLiliaUiConfig(testAppConfig);
    const { theme, setTheme } = useTheme();

    setTheme("dark");

    expect(theme.value).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(themeStorageKey)).toBe("dark");
  });

  it("弱分割 token 在深浅主题下可用", () => {
    const darkShadowSurface = readCustomProperty(":root", "--shadow-surface");
    const lightShadowSurface = readCustomProperty(':root[data-theme="light"]', "--shadow-surface");

    expect(darkShadowSurface).toMatch(/oklch\(/);
    expect(lightShadowSurface).toMatch(/oklch\(/);
    expect(`${darkShadowSurface};${lightShadowSurface}`).not.toMatch(/#[\da-fA-F]{3,8}|rgba?\(|hsla?\(/);

    expect(readCustomProperty(":root", "--divider-soft")).toBe("var(--border-soft)");
  });
});
