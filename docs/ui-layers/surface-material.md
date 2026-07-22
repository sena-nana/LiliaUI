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

## Surface Fill

背景填充使用 `--lilia-surface-fill-*`：`base`（=`--bg`）与 `raised`（=`--bg-elev`）。Translucent 时 base 为 transparent，raised 为 tint × `--lilia-surface-opacity-raised`（默认 0.82）。`floating` / `overlay` level 复用 raised fill。

- `data-lilia-surface-mode` + `data-lilia-surface-level` 写入 `--lilia-surface-fill`；组件背景优先读该变量。
- 位于 translucent 祖先内的 Card，即便自身默认 solid，也会用 raised translucent fill，避免实色盖死 Mica/Acrylic。
- `data-lilia-reduced-transparency`、`prefers-contrast: more` 与 `forced-colors: active` 回退到 solid fill。
- `LiliaDesktopShell` 用 `resolveBackdropSurfaces` 按 `backdropTarget` 接线区域 `surfaceMode`；`AppShell` 保留唯一 `native`，workspace 显式 `backdropEffect: none`。

## Surface Boundary 与 Backdrop 所有权

- 新的实体卡片、菜单、浮层或独立材质区必须设置 `data-lilia-surface-boundary` 并显式给出 mode、backdrop、level。
- 同一视觉区域只有最外层负责采样的 Surface 可以使用 `native` 或 `css-blur`；子组件一律使用 `none`。
- `solid + native/css-blur` 会由 Foundation 规范化为 `solid + none`，避免在完全不透明的 Surface 上保留无效 Backdrop 所有权。
- 原生 Mica、macOS Vibrancy 和 Windows Acrylic 都使用 `translucent + native`；CSS 模糊使用 `translucent + css-blur`；普通界面使用 `solid + none`。四种模式共享同一组件状态 API。

## Interaction State Layer

状态语义冻结为下表；组件不得用局部颜色覆盖这些 token：

| Surface | idle | hover | pressed | selected | selected-hover | focus |
| --- | --- | --- | --- | --- | --- | --- |
| solid / base | transparent | `--lilia-color-state-hover-solid` | `--lilia-color-state-pressed-solid` | `--lilia-color-state-selected-solid` | `--lilia-color-state-selected-hover-solid` | `--lilia-state-focus-ring` |
| solid / raised | 由 Surface 提供实体底色 | 同 solid/base | 同 solid/base | 同 solid/base | 同 solid/base | 同上 |
| translucent / 任意 level | transparent | `--lilia-color-state-hover-translucent` | `--lilia-color-state-pressed-translucent` | `--lilia-color-state-selected-translucent` | `--lilia-color-state-selected-hover-translucent` | 同上 |

List、Tree、Sidebar 和 Menu 使用选中填充、文字色与 ARIA 语义表达持续选中，不使用单侧 indicator。Card 和带边框的 List Item 在需要边缘强调时使用完整四边边框；Tabs、SegmentedControl 与 Toolbar Toggle 可以使用底边 indicator。状态背景颜色只来自共享 State Layer，完整边框与底边 indicator 由组件类别声明。raised 只改变 Surface level，不创建另一套交互颜色。

组件只映射 `hover`、`pressed`、`selected`、`selected-hover`、`selected-pressed` 和 `focus`：

```css
.item:hover { background: var(--lilia-state-layer-hover); }
.item:active { background: var(--lilia-state-layer-pressed); }
.item[data-lilia-selected="true"] {
  background: var(--lilia-state-layer-selected);
  color: var(--lilia-state-foreground-selected);
}
.item:focus-visible { outline-color: var(--lilia-state-focus-ring); }
```

Solid Surface 的 State Layer 指向主题中预生成的完全不透明 OKLCH 颜色；Translucent Surface 才指向局部 alpha 颜色。未交互项保持透明。组件不得使用 `backdrop-filter`、`filter: blur()`、`mix-blend-mode`、默认 `will-change` 或运行时背景取色。

持续选中在视觉上由选中填充与文字色表达，并使用 `aria-selected`、`aria-pressed` 或 `aria-current` 之一提供与控件角色匹配的语义。Card/List Item 的边缘强调是完整四边边框，Tabs/Segmented/Toolbar Toggle 保留底部指示条；Focus 始终由独立 outline 表达，不与 selected 共用指示几何。

## 通用状态映射

现有公共组件已经覆盖 Sidebar/Navigation/Tree、List、Menu、Tabs/SegmentedControl、Dropdown Select、SearchDropdown Command Palette、Interactive Card 与 Toolbar Toggle。原生 `<select><option>` 的平台绘制不强制覆盖；需要统一 Option State Layer 时使用 `Dropdown`。

业务组件使用 `.lilia-interactive-item` 或 `data-lilia-interactive` 获取相同 Token，并在自身角色上设置对应 ARIA 选中语义；不应为列表、导航、菜单或表格行添加单侧选中条。

## 可访问性与降级

将 `data-lilia-reduced-transparency="true"` 设置在文档根或某个 Surface 上，会让其 Translucent State Layer 解析回 Solid Token，不改变 DOM、布局或尺寸。`prefers-contrast: more` 与 `forced-colors: active` 使用相同回退路径。

原生材质初始化失败、远程桌面、节能模式或用户关闭透明效果时，应用应切换这个属性或把 SurfaceMode 改为 `solid`，而不是修改每个组件。

## 验证

- `tests/ui/surfaceStateLayer.test.ts` 验证 Contract、Surface attributes 与组件状态语义。
- `tests/ui/surfaceStateLayer.browser.mjs` 在 Chromium 中验证 Solid 不透明、Translucent 局部 alpha、CSS Blur 单一所有权、Reduced Transparency 布局稳定、普通 selected 项无单侧阴影、底部 indicator 与 Focus 保持独立，以及 Solid 项不产生独立合成层。
- `tests/visual/VisualFixture.vue` 同时渲染 Solid/Translucent、light/dark 两套状态 fixture。
- `SurfaceStateLayerLongList` 浏览器性能场景覆盖 240 行列表的材质切换、选中切换与点击。
- `tests/ui/desktopShell.test.ts` 验证 DesktopShell 按 `backdropTarget` 接线 sidebar/main SurfaceMode。
