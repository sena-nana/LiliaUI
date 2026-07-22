# UI Layer 质量验证矩阵

本页把 Contract/Foundation 与官方 `@lilia/ui` Layer 的发布要求映射到当前验证入口。表中“已有”表示仓库中存在对应自动测试；“部分”或“待补”不能作为 Epic 验收完成证据。新增公共能力时，应扩展相应功能场景，不用日志或字符串硬匹配替代行为证明。

## 基础门禁

```bash
yarn typecheck
yarn test
yarn perf:components:light
```

涉及 overlay、Shell、菜单、transition、全局监听、重复交互或布局时，再运行：

```bash
yarn perf:components:browser
yarn test:ui:browser
```

## 验证映射

| 目标 | 主要证据 | 状态 |
| --- | --- | --- |
| Contract 控件调用与 Professional aliases | `tests/ui/contractForms.test.ts`、`contractOverlays.test.ts`、`contractFeedbackSurfaces.test.ts` | 已有 |
| Professional 既有入口兼容 | `tests/ui/publicEntrypoints.test.ts`、现有 `tests/ui/**` 行为测试 | 已有 |
| 组合 Desktop Shell 的 Region 组合与 Router-free 边界 | `tests/ui/desktopShell.test.ts` | 已有 |
| Shell/Provider/Settings 框架一致性 | `tests/ui/frameworkLayerConformance.test.ts` | 已有 |
| Contract 行为与状态覆盖 | `tests/ui/contractLayerConformance.test.ts` | 已有 |
| app config 的 preset/onboarding；拒绝已移除的 nana/layout | `tests/config.test.mjs`、`tests/config-types.test.ts` | 已有 |
| 组件性能回归 | `tests/perf/componentScenarios.ts` 与性能 baseline | 已有 |
| Contract fixture 编译 `@lilia/ui` | `examples/contract-layers` 的 typecheck/build | 已有 |
| 官方 Layer 视觉回归 | `tests/visual/__screenshots__` 的状态矩阵 | 已有 |
| color contrast、200% zoom、长文本 | `tests/visual/ui-layers.visual.spec.ts` 的真实 Chromium CSS/axe/overflow 场景 | 已有 |
| reduced motion 行为 | 同一浏览器场景验证 Skeleton 动画由 media query 停止 | 已有 |
| Surface/State Layer 材质、降级与合成边界 | `tests/ui/surfaceStateLayer.test.ts`、`surfaceStateLayer.browser.mjs`、视觉 fixture、`SurfaceStateLayerLongList` 浏览器性能场景 | 已有 |

## Contract 变更证据

每个新增或变更的 Contract 组件至少证明：

- Props、event、slot、v-model 的类型调用；
- enabled/disabled/loading/invalid/selected 等相关状态；
- 键盘、焦点、Escape、外部关闭或 ARIA live 等适用行为；
- `@lilia/ui` 实现遵守相同调用契约；
- root/subpath export 可从已发布包路径导入；
- 新增公共组件具备轻量性能场景，复杂 overlay/shell 具备浏览器证据。

## 浏览器质量证据

以下证据由 `yarn test:ui:visual` 自动执行，并已接入 `yarn verify`：

- Lilia light/dark × comfortable/compact 的真实截图矩阵；
- 截图覆盖 hover、focus、disabled、loading、selected 和语义状态；
- Chromium 中以真实 Layer CSS 执行 axe `color-contrast`，不禁用规则；
- 200% 渲染比例和长文本下检查关键容器与视口横向溢出；
- `prefers-reduced-motion: reduce` 下 loading 动画的 computed style 为 `none`。
- Solid/Translucent 状态色、Reduced Transparency/High Contrast 回退、Backdrop 单一所有权和 Solid 项无独立合成层。

有意调整视觉结构后，使用 `yarn test:ui:visual:update` 更新截图，再立即运行普通视觉命令确认基线稳定。

人工验证可以作为临时发布证据，但必须记录环境、步骤、结果与截图；未记录的人工判断不算已验收。

## 包与依赖证据

发布前检查：

- `@lilia/ui-contract` 不依赖具体 Layer 或 Vue 组件实现；
- `@lilia/ui-foundation` 不依赖 `@lilia/ui`；
- `@lilia/ui` 只向下依赖 Contract/Foundation；
- CSS exports 在 `sideEffects` 中声明；
- 远端 Git workspace 的 Layer/Contract/Foundation 使用同一 commit。

## 基线更新

- 只有有意的组件结构或交互变化才能更新性能/视觉基线。
- 先运行现有基线确认回归来源，再使用专用 update 命令。
- Changelog 记录新增场景、阈值或预期 bundle 变化。
- 不用放宽阈值、删除状态或跳过浏览器场景掩盖回归。

## 消费验证

当 Template 或应用更新到新 commit 后，至少运行：

```bash
yarn install --immutable
yarn agent:debug --json
yarn test
yarn build
```

涉及 Tauri 公共运行时时，再增加消费应用的 `cargo check --manifest-path src-tauri/Cargo.toml`。验证结果必须区分本次改动失败与已知环境/基线失败。
