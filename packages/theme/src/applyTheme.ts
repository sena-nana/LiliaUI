export type ResolvedTheme = "light" | "dark";
export type CornerStyle = "smooth" | "round";
export type SurfaceMode = "solid" | "translucent";

export interface ApplyThemeOptions {
  /** 解析后的主题（`system` 需由调用方先解析为 light/dark）。 */
  theme?: ResolvedTheme;
  /** 圆角风格，写入 `data-corners`。 */
  corners?: CornerStyle;
  /** 圆角半径（px），写入 `--app-corner-radius`。 */
  cornerRadius?: number;
  /** 表层材质，写入 `data-lilia-surface-mode`。 */
  surfaceMode?: SurfaceMode;
  /** 目标元素，默认 `document.documentElement`。 */
  target?: HTMLElement;
}

/**
 * 框架无关的主题应用：把主题状态写成 DOM 数据属性 / CSS 变量。
 * 无 Vue / Tauri 依赖，可被任意宿主（含无框架）直接调用。
 * 在无 DOM 环境（SSR）下安全空操作。
 */
export function applyTheme(options: ApplyThemeOptions = {}): void {
  if (typeof document === "undefined") return;
  const target = options.target ?? document.documentElement;
  if (!target) return;

  if (options.theme) target.dataset.theme = options.theme;
  if (options.corners) target.dataset.corners = options.corners;
  if (typeof options.cornerRadius === "number") {
    target.style.setProperty("--app-corner-radius", `${options.cornerRadius}px`);
  }
  if (options.surfaceMode) {
    target.dataset.liliaSurfaceMode = options.surfaceMode;
  }
}
