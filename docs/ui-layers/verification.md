# UI Layer 质量验证矩阵

本页把 Contract/Foundation 抽取与双 Layer 发布要求映射到当前验证入口。表中“已有”表示仓库中存在对应自动测试；“部分”或“待补”不能作为 Epic 验收完成证据。新增公共能力时，应扩展相应功能场景，不用日志或字符串硬匹配替代行为证明。

## 基础门禁

```bash
pnpm typecheck
pnpm test
pnpm perf:components:light
```

涉及 overlay、Shell、菜单、transition、全局监听、重复交互或布局时，再运行：

```bash
pnpm perf:components:browser
pnpm test:ui:browser
```

## 验证映射

| 目标 | 主要证据 | 状态 |
| --- | --- | --- |
| Contract 控件调用与 Professional aliases | `tests/ui/contractForms.test.ts`、`contractOverlays.test.ts`、`contractFeedbackSurfaces.test.ts` | 已有 |
| Professional 既有入口兼容 | `tests/ui/publicEntrypoints.test.ts`、现有 `tests/ui/**` 行为测试 | 已有 |
| 双 Layer Shell/Provider/Settings 框架一致性 | `tests/ui/frameworkLayerConformance.test.ts` | 已有 |
| Nana Provider/Policy 与基础组件 | `tests/ui/nana/providerComponents.test.ts` | 已有 |
| Nana Overlay、Shell、Sidebar | `tests/ui/nana/overlayShell.test.ts` | 已有 |
| Nana 表单、进度、Shell landmark 的结构性 a11y | `tests/ui/nana/accessibility.test.ts`；浏览器 contrast 见视觉质量入口 | 已有 |
| Nana 恢复、autosave、undo 状态机 | `tests/ui/nana/state.test.ts` | 已有 |
| Nana 独立包、非法反向依赖 | `tests/nana-package.test.mjs` 的 manifest/import 检查 | 已有 |
| Nana tree-shaking 与 lazy chunk | `tests/nana-package.test.mjs` 的 base-only/lazy build 场景 | 已有 |
| preset/source 漂移、幂等与 dry-run | `tests/tools/uiPreset.test.mjs` | 已有 |
| 非破坏迁移和 Contract stop | `tests/tools/uiMigration.test.mjs` | 已有 |
| 原子回滚与脏树保护 | `tests/tools/uiTransaction.test.mjs` | 已有 |
| app config 的 preset/layout/onboarding | `tests/config.test.mjs`、`tests/config-types.test.ts` | 已有 |
| 组件性能回归 | `tests/perf/componentScenarios.ts`、拆分 Nana 场景与两套性能 baseline | 已有 |
| 同一 shared fixture 分别编译 Lilia/Nana | `examples/contract-layers` 同源页面的双 typecheck/build | 已有 |
| 两套 Layer 独立视觉回归 | `tests/visual/__screenshots__` 的双 Layer 状态矩阵 | 已有 |
| color contrast、200% zoom、长文本 | `tests/visual/ui-layers.visual.spec.ts` 的真实 Chromium CSS/axe/overflow 场景 | 已有 |
| reduced motion 行为 | 同一浏览器场景验证两层 Skeleton 动画由 media query 停止 | 已有 |
| Surface/State Layer 材质、降级与合成边界 | `tests/ui/surfaceStateLayer.test.ts`、`surfaceStateLayer.browser.mjs`、双 Layer 视觉 fixture、`SurfaceStateLayerLongList` 浏览器性能场景 | 已有 |

## Contract 变更证据

每个新增或变更的 Contract 组件至少证明：

- Props、event、slot、v-model 的类型调用；
- enabled/disabled/loading/invalid/selected 等相关状态；
- 键盘、焦点、Escape、外部关闭或 ARIA live 等适用行为；
- Lilia 与 Nana 的实现都能遵守相同调用契约；
- root/subpath export 可从已发布包路径导入；
- 新增公共组件具备轻量性能场景，复杂 overlay/shell 具备浏览器证据。

视觉截图不要求两个 Layer 一致。要求一致的是 Contract 和状态覆盖；主题、密度、Shell 结构和 Policy 默认值分别维护基线。

## 浏览器质量证据

以下证据由 `pnpm test:ui:visual` 自动执行，并已接入 `pnpm verify`：

- Lilia/Nana 分别维护 light/dark × comfortable/compact 的真实截图矩阵；
- 截图覆盖 hover、focus、disabled、loading、selected 和语义状态；
- Chromium 中以真实 Layer CSS 执行 axe `color-contrast`，不禁用规则；
- 200% 渲染比例和长文本下检查关键容器与视口横向溢出；
- `prefers-reduced-motion: reduce` 下两层 loading 动画的 computed style 均为 `none`。
- Solid/Translucent 状态色、Reduced Transparency/High Contrast 回退、Backdrop 单一所有权和 Solid 项无独立合成层。

有意调整视觉结构后，使用 `pnpm test:ui:visual:update` 更新截图，再立即运行普通视觉命令确认基线稳定。

人工验证可以作为临时发布证据，但必须记录环境、步骤、结果与截图；未记录的人工判断不算已验收。

## 包与依赖证据

发布前检查：

- `@lilia/ui-contract` 不依赖具体 Layer 或 Vue 组件实现；
- `@lilia/ui-foundation` 不依赖 `@lilia/ui`/`@lilia/nana-ui`；
- 两个 Layer 只向下依赖 Contract/Foundation，不互相依赖；
- CSS exports 在 `sideEffects` 中声明，基础入口不会隐式加载可选 pattern；
- `@lilia/nana-ui/lazy` 形成独立异步 chunk；
- 远端 Git workspace 的 Layer/Contract/Foundation 使用同一 commit。

## 基线更新

- 只有有意的组件结构或交互变化才能更新性能/视觉基线。
- 先运行现有基线确认回归来源，再使用专用 update 命令。
- Changelog 记录新增场景、阈值或预期 bundle 变化。
- 不用放宽阈值、删除状态或跳过浏览器场景掩盖回归。

## 消费验证

当 Template 或应用更新到新 commit 后，至少运行：

```bash
pnpm install --frozen-lockfile
pnpm agent:debug --json
pnpm test
pnpm build
```

涉及 Tauri 公共运行时时，再增加消费应用的 `cargo check --manifest-path src-tauri/Cargo.toml`。验证结果必须区分本次改动失败与已知环境/基线失败。
