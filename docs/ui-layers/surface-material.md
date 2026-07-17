# Surface Material 与 Interaction State Layer

## 责任边界

`Surface 负责材质与背景合成，State Layer 负责交互反馈，Component 只负责状态映射`。

Surface 由三个互不替代的维度组成：

- `SurfaceMode`: `solid | translucent`，决定后代交互状态解析为不透明颜色还是局部 alpha 叠加。
- `BackdropEffect`: `none | native | css-blur`，决定当前 Surface 是否拥有背景采样；`native` 表示 Mica/Vibrancy 由窗口层提供。
- `SurfaceLevel`: `base | raised | floating | overlay`，只表达层级，不推断透明度。

类型由 `@lilia/ui-contract/surfaces` 导出。Foundation 的 `resolveSurfaceAttributes` 只把显式配置转换为稳定 data attributes，不读取背景、不创建 Vue Context，也不计算颜色：

```ts
import { resolveSurfaceAttributes } from "@lilia/ui-foundation/surface";

const attributes = resolveSurfaceAttributes({
  surfaceMode: "translucent",
  backdropEffect: "native",
  surfaceLevel: "base",
  surfaceBoundary: true,
});
```

对应 DOM 契约：

```html
<aside
  data-lilia-surface-mode="translucent"
  data-lilia-backdrop="native"
  data-lilia-surface-level="base"
  data-lilia-surface-boundary
></aside>
```

## Surface Boundary 与 Backdrop 所有权

- 新的实体卡片、菜单、浮层或独立材质区必须设置 `data-lilia-surface-boundary` 并显式给出 mode、backdrop、level。
- 同一视觉区域只有最外层负责采样的 Surface 可以使用 `native` 或 `css-blur`；子组件一律使用 `none`。
- `solid + native/css-blur` 会由 Foundation 规范化为 `solid + none`，避免在完全不透明的 Surface 上保留无效 Backdrop 所有权。
- 原生 Mica、macOS Vibrancy 和 Windows Acrylic 都使用 `translucent + native`；CSS 模糊使用 `translucent + css-blur`；普通界面使用 `solid + none`。四种模式共享同一组件状态 API。

## Interaction State Layer

组件只映射 `hover`、`pressed`、`selected`、`selected-hover`、`selected-pressed` 和 `focus`：

```css
.item:hover { background: var(--lilia-state-layer-hover); }
.item:active { background: var(--lilia-state-layer-pressed); }
.item[data-lilia-selected="true"] {
  background: var(--lilia-state-layer-selected);
  color: var(--lilia-state-foreground-selected);
  box-shadow: inset 3px 0 0 var(--lilia-state-indicator-selected);
}
.item:focus-visible { outline-color: var(--lilia-state-focus-ring); }
```

Solid Surface 的 State Layer 指向主题中预生成的完全不透明 OKLCH 颜色；Translucent Surface 才指向局部 alpha 颜色。未交互项保持透明。组件不得使用 `backdrop-filter`、`filter: blur()`、`mix-blend-mode`、默认 `will-change` 或运行时背景取色。

持续选中必须同时提供非背景信号。当前列表、树和导航使用起始边指示条，Tabs/Segmented/Toolbar Toggle 使用底部指示条，Card 使用边缘指示条；Focus 始终由独立 outline 表达。

## 通用状态映射

现有公共组件已经覆盖 Sidebar/Navigation/Tree、List、Menu、Tabs/SegmentedControl、Dropdown Select、SearchDropdown Command Palette、Interactive Card 与 Toolbar Toggle。原生 `<select><option>` 的平台绘制不强制覆盖；需要统一 Option State Layer 时使用 `Dropdown`。

仓库没有独立 Data Grid 业务组件。表格行直接使用稳定、无额外 DOM 的公共映射：

```html
<tr
  data-lilia-interactive
  data-lilia-selected="true"
  tabindex="0"
  aria-selected="true"
></tr>
```

这与 `.lilia-interactive-item` 使用相同 Token，并保持 Data Grid 的原生表格结构。

## 可访问性与降级

将 `data-lilia-reduced-transparency="true"` 设置在文档根或某个 Surface 上，会让其 Translucent State Layer 解析回 Solid Token，不改变 DOM、布局或尺寸。`prefers-contrast: more` 与 `forced-colors: active` 使用相同回退路径。

原生材质初始化失败、远程桌面、节能模式或用户关闭透明效果时，应用应切换这个属性或把 SurfaceMode 改为 `solid`，而不是修改每个组件。

## 验证

- `tests/ui/surfaceStateLayer.test.ts` 验证 Contract、Surface attributes 与组件状态语义。
- `tests/ui/surfaceStateLayer.browser.mjs` 在 Chromium 中验证 Solid 不透明、Translucent 局部 alpha、CSS Blur 单一所有权、Reduced Transparency 布局稳定、Focus/Selected 非颜色信号，以及 Solid 项不产生独立合成层。
- `tests/visual/VisualFixture.vue` 同时渲染 Solid/Translucent、light/dark 两套状态 fixture。
- `SurfaceStateLayerLongList` 浏览器性能场景覆盖 240 行列表的材质切换、选中切换与点击。
