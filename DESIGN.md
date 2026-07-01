# LiliaUI 设计标准

## 0. 仓库定位

LiliaUI 是桌面应用模板和后续应用的公共 UI 与工程工具依赖源。设计系统、桌面壳、基础组件、主题、默认资源、配置和构建流程都应在这里沉淀,消费仓库只配置和组合这些能力。

公共包职责:

- `@lilia/ui`: 视觉与交互源实现。
- `@lilia/config`: 可继承配置和 app 元数据同步。
- `@lilia/tools`: 默认资源、模板检查和迁移工具。
- `@lilia/build`: 开发、构建、Tauri 和验证流程。
- `tauri-plugin-lilia`: Tauri 主窗口准备和窗口状态持久化。

## 1. 设计原则

- 克制、清晰、可扫描。
- 面向重复工作,保持足够信息密度,但不制造噪音。
- 默认安静,只在用户必须处理状态或风险时提高可见度。
- 主内容 > 当前状态 > 过程信息 / 辅助操作。
- 所有可见控件必须连接真实功能或真实状态,禁止路线图式假入口。

每个主界面都应让用户快速回答:

- 我现在在哪里?
- 当前页面状态是什么?
- 下一步是否需要我操作?

## 2. 布局系统

- 标题栏、侧边栏、主工作区、设置页和浮层体系由 `@lilia/ui` 提供。
- 消费仓库通过 app config、路由和命令扩展应用,不重新实现桌面壳。
- 标题栏保持紧凑,窗口控制和侧栏开关使用稳定图标按钮。
- 侧边栏用于导航和少量全局操作;状态 footer 只表达真实状态。
- 主工作区承载业务页面,避免落地页式 hero、营销文案、装饰面板和嵌套卡片。

## 3. 色彩与主题

主题令牌由 `packages/ui/src/styles.css` 入口导入的 `packages/ui/src/styles/tokens.css` 维护。新增颜色前先判断是否已有语义令牌可以表达。

| 令牌 | 用途 |
| --- | --- |
| `--bg` | 主工作区表面 |
| `--bg-elev` | 标题栏、侧栏、卡片、浮层 |
| `--bg-subtle` | 输入框、代码块、chip、非激活列表表面 |
| `--bg-hover` | 行和轻量控件 hover 背景 |
| `--bg-active` | 激活行、选中 tab、按下状态 |
| `--border-soft` | 低强调分隔线和内部边界 |
| `--border` | 标准组件边界 |
| `--border-strong` | 浮层、激活输入、强交互边界 |
| `--text` | 主文本 |
| `--text-muted` | 次要标签、元信息、非激活控件 |
| `--text-faint` | 占位、路径、弱提示 |
| `--accent` | 当前项、主操作、焦点 |
| `--accent-strong` | 强主操作 |
| `--accent-soft` | 选中底色、轻量主色 hover、正常状态底色 |
| `--accent-text` | 主色按钮上的文字 |
| `--ok` / `--warn` / `--err` | 成功、警告、错误状态 |
| `--ok-soft` / `--warn-soft` / `--err-soft` | 状态底色、危险 hover 或确认态底色 |
| `--err-solid` / `--err-solid-hover` / `--err-solid-text` | 实心危险主按钮 |

所有颜色变量必须使用 CSS `oklch(...)` 表达。`var(...)` 语义别名可以保留,但公开 token 中禁止新增 hex、rgb、rgba、hsl 或 hsla 颜色字面量。色相、冷暖倾向和饱和度用于设计调整,不作为自动化硬检查;硬检查只约束 OKLCH 数值合法性和用途层级的视觉亮度。

| 层级 | 暗色主题 L 范围 | 浅色主题 L 范围 | 令牌 |
| --- | --- | --- | --- |
| 基础表面 | 20-26 | 96-100 | `--bg`、`--bg-subtle`、`--bg-elev` |
| 交互表面和边界 | 25-36 | 83-97 | `--bg-hover`、`--bg-active`、`--border-soft`、`--border`、`--border-strong` |
| 主文本 | 88-92 | 20-24 | `--text` |
| 次级文本 | 61-66 | 53-58 | `--text-muted` |
| 弱提示文本 | 44-49 | 69-73 | `--text-faint` |
| 语义和主操作前景 | 64-78 | 52-66 | `--accent`、`--accent-strong`、`--ok`、`--warn`、`--err` |
| 实心危险按钮 | 54-61 | 48-54 | `--err-solid`、`--err-solid-hover` |
| 实心按钮文字 | 18-24 或 98-100 | 98-100 | `--accent-text`、`--err-solid-text` |
| 阴影和遮罩 | 0-22 | 0-22 | `--shadow`、`--shadow-lg`、`--scrim`、`--shadow-dialog`、`--shadow-menu` |

soft 令牌只用于状态底色、选中底色和危险 hover,不要扩大成页面背景或装饰色块。`--accent-soft`、`--ok-soft`、`--warn-soft`、`--err-soft` 这类带 alpha 的底色按叠加到目标表面后的视觉 L 判断,不按源色 L 判断。

## 4. 样式组织

- `packages/ui/src/styles.css` 维护主题令牌、reset、字体、selection、基础表单控件和通用状态类。
- `packages/ui/src/styles/shell.css` 维护桌面壳布局。
- `packages/ui/src/styles/page.css` 维护页面基础结构,例如 `.page-header`、`.card`、`.kv`。
- 单组件 CSS 由组件自身导入;需要公开消费时通过 `@lilia/ui` 的细粒度 CSS export 暴露。
- 组件私有样式保留在对应 SFC 的 scoped style 中。
- 跨页面复用才进入 page 样式;壳层专属才进入 shell 样式;单组件行为留在组件内或组件同目录 CSS。

## 5. 组件语言

- 熟悉工具优先使用图标按钮;明确命令使用文字按钮。
- 有可用图标时优先使用 `@lucide/vue`。
- 按钮、菜单项、导航行、tab、输入和 slider 都需要稳定尺寸,状态变化不能造成布局跳动。
- 文案短、直、可操作;按钮写动作,状态写事实,提示写影响。
- hover、active 反馈优先改变背景、边框和文字颜色,避免放大、位移、强阴影或高饱和装饰色。
- 文本必须能在紧凑宽度下省略或换行,不得溢出按钮、chip、行或卡片。

## 6. 桌面壳与侧边栏

- 标题栏高度、侧栏宽度、resize 行为和设置页结构由 `@lilia/ui` 统一维护。
- 侧栏宽度可拖拽并持久化,折叠状态要禁用不可见区域的交互。
- 区域之间依靠 gap 留白,不额外加装饰分隔线。
- 侧栏 action、导航树行和图标工具按钮保持紧凑稳定,支持 hover、active、muted 和 disabled。
- footer 是辅助区域,默认弱化;hover/focus 或 active 时恢复可读。
- `ok/warn/error/probing` 状态只表达真实状态,不要作为装饰色使用。

## 7. 页面、卡片和浮层

- 页面标题使用紧凑层级,说明文字使用 `--text-muted`;页面头部只做定位和状态说明,不要变成 hero。
- 卡片圆角保持 8px 左右,只承载独立信息组、重复项、弹窗或工具容器,不要嵌套卡片。
- key-value 列表允许 `overflow-wrap: anywhere`,避免路径、版本号或长标识撑破布局。
- 菜单、下拉、上下文菜单和确认弹窗使用 `--bg-elev`、边框令牌和克制阴影。
- 危险操作只在危险项 hover、pending 或确认态使用错误色。

## 8. 性能标准

- 公开 Vue 组件默认需要在 `tests/perf/componentScenarios.ts` 中有性能场景;新增公开导出时必须补齐场景。
- 组件场景至少覆盖主状态、一次有意义的响应式更新;可交互组件还应覆盖真实 DOM 交互,例如 click、input、change 或菜单选择。
- 常规公共 UI 变更至少运行 `yarn perf:components:light`;涉及 overlay、菜单、搜索、壳层布局、Teleport、transition、滚动、resize 或全局监听时,同时运行 `yarn perf:components:browser`。
- 性能 baseline 只能通过 `yarn perf:components:update-baseline` 显式更新;更新前要确认数值变化来自有意的功能或结构变化,而不是本机噪声。
- 交互反馈不能依赖昂贵重渲染、反复创建路由/config、全量列表重算或隐藏状态下仍活跃的监听器。
- overlay/list/search/shell 类组件优先关注交互延迟、长任务、DOM 节点增长和卸载清理;全局 listener、observer、timer 必须按需启用并在隐藏或卸载时释放。
- 性能报告只进入 CLI、JSON、Markdown 或评审说明,不要把技术性能说明加入应用 UI。

## 9. 动效与可访问性

- 常规 hover、active、边框和文字颜色过渡约 0.12s,保持及时反馈。
- 侧栏折叠和浮层进入退出可以有轻微透明度或位移,但必须支持 `prefers-reduced-motion: reduce`。
- loading、empty、disabled 状态不能改变控件固定尺寸。
- 交互控件需要可键盘访问,图标按钮需要可理解的辅助文本。
- `data-agent-id` 用于稳定定位关键交互,不能依赖易变文案。

## 10. 默认资源和配置

- 默认字体、图标和模板资源由 `@lilia/tools` 提供,消费仓库通过工具复制生成,不维护第二份源资源。
- Vite、VitePress、TypeScript 和 app config 同步能力由 `@lilia/config` 提供。
- dev/build/docs/Tauri/verify 流程由 `@lilia/build` 提供。
- Tauri 主窗口准备、窗口状态恢复和关闭时持久化由 `tauri-plugin-lilia` 提供。
- 新增资源或流程时先保证消费仓库能通过 Git workspace 依赖直接使用。

## 11. 评审清单

- 设计仍然像克制的工程工具。
- 公共 UI 能被多个消费仓库复用,没有混入单一业务应用语义。
- 可见入口都连接真实功能或真实状态。
- 新颜色来自现有令牌,或新增了清晰的语义令牌。
- 深浅主题都可读。
- 控件在 hover、active、loading、empty、disabled 状态下尺寸稳定。
- 公开组件有性能场景,轻量基准无回归;复杂交互、浮层或壳层变更有浏览器采样报告。
- 文本不会溢出紧凑容器。
- 动效不抢注意力,并尊重 reduced motion。
- 公共配置、工具、资源、构建流程和 Tauri 运行时逻辑没有在消费仓库复制第二份。
