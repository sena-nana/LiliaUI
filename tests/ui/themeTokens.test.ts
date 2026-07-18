import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type ThemeName = "dark" | "light";
type Range = readonly [number, number];
type TokenRanges = Record<string, readonly Range[]>;

interface OklchColor {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

const tokenCss = readFileSync("packages/ui/src/styles/tokens.css", "utf8");
const forbiddenColorSyntax = /#[\da-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/;
const oklchSyntax = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/g;

const colorTokens = [
  "bg", "bg-elev", "bg-subtle", "bg-hover", "bg-active",
  "border", "border-soft", "border-strong",
  "text", "text-muted", "text-faint",
  "accent", "accent-strong", "accent-soft", "accent-text",
  "ok", "warn", "err", "ok-soft", "warn-soft", "err-soft",
  "err-solid", "err-solid-hover", "err-solid-text",
  "shadow", "shadow-lg", "scrim", "shadow-dialog", "shadow-menu",
] as const;

const directRanges: Record<ThemeName, TokenRanges> = {
  dark: {
    bg: [[20, 26]], "bg-subtle": [[20, 26]], "bg-elev": [[20, 26]],
    "bg-hover": [[25, 36]], "bg-active": [[25, 36]],
    "border-soft": [[25, 36]], border: [[25, 36]], "border-strong": [[25, 36]],
    text: [[88, 92]], "text-muted": [[69, 73]], "text-faint": [[44, 49]],
    accent: [[64, 78]], "accent-strong": [[64, 78]], ok: [[64, 78]], warn: [[64, 78]], err: [[64, 78]],
    "err-solid": [[54, 61]], "err-solid-hover": [[54, 61]],
    "accent-text": [[18, 24], [98, 100]], "err-solid-text": [[18, 24], [98, 100]],
    shadow: [[0, 22]], "shadow-lg": [[0, 22]], scrim: [[0, 22]],
    "shadow-dialog": [[0, 22]], "shadow-menu": [[0, 22]],
  },
  light: {
    bg: [[96, 100]], "bg-subtle": [[96, 100]], "bg-elev": [[96, 100]],
    "bg-hover": [[83, 97]], "bg-active": [[83, 97]],
    "border-soft": [[83, 97]], border: [[83, 97]], "border-strong": [[83, 97]],
    text: [[20, 24]], "text-muted": [[48, 54]], "text-faint": [[69, 73]],
    accent: [[52, 66]], "accent-strong": [[52, 66]], ok: [[52, 66]], warn: [[52, 66]], err: [[52, 66]],
    "err-solid": [[48, 54]], "err-solid-hover": [[48, 54]],
    "accent-text": [[98, 100]], "err-solid-text": [[98, 100]],
    shadow: [[0, 22]], "shadow-lg": [[0, 22]],
  },
};

const softRanges: Record<ThemeName, TokenRanges> = {
  dark: {
    "accent-soft": [[25, 36]], "ok-soft": [[25, 36]], "warn-soft": [[25, 36]], "err-soft": [[25, 36]],
  },
  light: {
    "accent-soft": [[83, 97]], "ok-soft": [[83, 97]], "warn-soft": [[83, 97]], "err-soft": [[83, 97]],
  },
};

function block(selector: string): string {
  const start = tokenCss.indexOf(selector);
  expect(start, `${selector} block should exist`).toBeGreaterThanOrEqual(0);

  const openBrace = tokenCss.indexOf("{", start);
  const closeBrace = tokenCss.indexOf("\n}", openBrace);
  expect(closeBrace, `${selector} block should close`).toBeGreaterThan(openBrace);
  return tokenCss.slice(openBrace + 1, closeBrace);
}

function declarations(theme: ThemeName): Record<string, string> {
  const parse = (source: string) => Object.fromEntries(
    Array.from(source.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g), ([, token, value]) => [token, value.trim()]),
  );

  return theme === "dark"
    ? parse(block(":root"))
    : { ...parse(block(":root")), ...parse(block(':root[data-theme="light"]')) };
}

function oklchColors(value: string): OklchColor[] {
  oklchSyntax.lastIndex = 0;
  return Array.from(value.matchAll(oklchSyntax), ([, l, c, h, alpha]) => ({
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: alpha === undefined ? 1 : Number(alpha),
  }));
}

function firstColor(tokens: Record<string, string>, token: string): OklchColor {
  const colors = oklchColors(tokens[token]);
  expect(colors, `--${token} should contain one OKLCH color`).toHaveLength(1);
  return colors[0];
}

function expectInRange(value: number, ranges: readonly Range[], label: string): void {
  const ok = ranges.some(([min, max]) => value >= min && value <= max);
  expect(ok, `${label} L ${value.toFixed(2)} should match ${JSON.stringify(ranges)}`).toBe(true);
}

function alphaCompositeLightness(foreground: OklchColor, backdrop: OklchColor): number {
  return foreground.l * foreground.alpha + backdrop.l * (1 - foreground.alpha);
}

describe("theme color tokens", () => {
  it("只使用 OKLCH 颜色字面量", () => {
    expect(tokenCss).not.toMatch(forbiddenColorSyntax);
  });

  it("公开颜色 token 都有合法 OKLCH 数值", () => {
    for (const theme of ["dark", "light"] as const) {
      const tokens = declarations(theme);

      for (const token of colorTokens) {
        const colors = oklchColors(tokens[token]);
        expect(colors.length, `${theme} --${token} should contain OKLCH color`).toBeGreaterThan(0);

        for (const color of colors) {
          expect(color.l, `${theme} --${token} L`).toBeGreaterThanOrEqual(0);
          expect(color.l, `${theme} --${token} L`).toBeLessThanOrEqual(100);
          expect(color.c, `${theme} --${token} C`).toBeGreaterThanOrEqual(0);
          expect(color.h, `${theme} --${token} H`).toBeGreaterThanOrEqual(0);
          expect(color.h, `${theme} --${token} H`).toBeLessThanOrEqual(360);
          expect(color.alpha, `${theme} --${token} alpha`).toBeGreaterThanOrEqual(0);
          expect(color.alpha, `${theme} --${token} alpha`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("同用途颜色落在对应视觉亮度层级", () => {
    for (const theme of ["dark", "light"] as const) {
      const tokens = declarations(theme);

      for (const [token, ranges] of Object.entries(directRanges[theme])) {
        for (const color of oklchColors(tokens[token])) {
          expectInRange(color.l, ranges, `${theme} --${token}`);
        }
      }
    }
  });

  it("soft 底色按叠加后的视觉亮度归入表面层级", () => {
    for (const theme of ["dark", "light"] as const) {
      const tokens = declarations(theme);
      const backdrop = firstColor(tokens, "bg-elev");

      for (const [token, ranges] of Object.entries(softRanges[theme])) {
        const lightness = alphaCompositeLightness(firstColor(tokens, token), backdrop);
        expectInRange(lightness, ranges, `${theme} --${token} composited`);
      }
    }
  });
});
