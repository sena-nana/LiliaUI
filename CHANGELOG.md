# Changelog

## 2026-07-21 — 删除迁移骨架并新增组合 Shell

### Contract breaking

- 移除 `lilia-tools ui-migrate`、`lilia-tools ui-preset` 子命令与 `@lilia/tools/ui-migrate`、`@lilia/tools/ui-preset` 公共导出;本仓库不再向消费仓库生成 `src/ui/LegacyShell.vue` / `src/ui/legacy-shell.ts`,也不再重新导出 `LegacyAppShell` / `LiliaDesktopShell` / `NanaAppShell` / `NanaDesktopShell` 旧名字。preset 与依赖来源的切换由消费应用自行管理。
- 删除 `tests/tools/uiMigration.test.mjs`、`tests/tools/uiPreset.test.mjs`、`tests/tools/uiTransaction.test.mjs`、`tests/tools/uiFixture.mjs` 与聚合入口 `tests/ui-tools.test.mjs`。

### Lilia Layer

- 新增 Router-free 组合 Shell `LiliaDesktopShell`(`@lilia/ui/shell`),内部组合 `LiliaAppShell` + `LiliaWorkspace` + `LiliaSectionNavigation`(导航 + `SidebarFooter`)+ `LiliaPrimaryContent` + 可选 `LiliaBottomPanel` / `LiliaInspector`,消费端把 `<RouterView />` 放进默认槽即可,无需手动拼 Region。

### Nana Layer

- 新增 Router-free 组合 Shell `NanaDesktopShell`(`@lilia/nana-ui/shell`),内部组合 `NanaAppShell` + `NanaSidebar` + 主区 + 可选 context/status,作为被删除的 Nana legacy scaffold 的公共包内替代品,Router 仍由消费端持有且不重新导出旧名字。

### Validation and performance

- 新增 `tests/ui/desktopShell.test.ts` 覆盖两个组合 Shell 的 Region 组合、Router-free 边界、header slot 透传与 sidebar 受控事件;`tests/ui/publicEntrypoints.test.ts` 补充两个新组件的 subpath 导出断言。

### Tooling and migration

- `packages/tools/bin/lilia-tools.mjs` 移除 `ui-preset` / `ui-migrate` 分发分支;`packages/tools/package.json` 移除对应 exports 与 typecheck 范围。迁移文档改为指向组合 Shell 的手动迁移路径。

## 2026-07-19 — 旧 Shell 自动迁移

### Tooling and migration

- `ui-migrate` 新增结构化 `legacyShellMigrations`，可为 `LiliaDesktopShell`、已知 `LegacyAppShell`、`NanaDesktopShell` 与使用旧 props 的 `NanaAppShell` 生成消费端双 Layer 最小骨架并重定向旧导入。
- 迁移骨架显式保留消费端 Router 与业务导航边界；定制骨架和未知 Legacy Shell 不会被静默覆盖，事务失败仍恢复新建文件与 lockfile。
- 迁移检查和修复覆盖 `@lilia/ui-contract`、`@lilia/ui-foundation` 的显式消费声明、依赖来源与 Git workspace commit 对齐。

## 2026-07-18 — Nana 桌面应用公共能力

### Contract 与 Foundation

- 侧栏契约新增分组、空状态、徽标和行操作；Agent Debug harness 与无边框窗口控制下沉到共享 Foundation，并保留 Professional diagnostics 兼容入口。

### Nana Layer

- `@lilia/nana-ui` 新增桌面标题栏、分组侧栏、应用壳层、持久化 system/light/dark 主题与密度、设置 Tab、外观与关于区块，以及 diagnostics、runtime 与 Tauri adapter 入口。

### Tooling and migration

- Nana preset/facade 纳入 diagnostics 与 runtime subpath，迁移检查统一报告单一 Layer、统一 revision 和直接 Layer import。

## 2026-07-18 — 双 Layer 框架统一

### Contract breaking

- Lilia/Nana 统一采用 Router-free `AppShell` 契约和 `header-leading`、`header-center`、`header-actions`、`overlays` 公共 slots；删除 `LiliaDesktopShell`、`LegacyAppShell`、`NanaDesktopShell` 以及 Nana Shell 内置导航、RouterView、context/status props。
- `AppUIPresetAdapter.provider` 改为必需；两个 Layer 的 preset adapter 均暴露 Router-free Shell 与 Policy Provider，根入口不再汇总 Provider 或 Contract 类型。

### Foundation

- 新增中性 UI Policy context，统一默认值、patch、replace 与 reset；Settings 新增共享 view resolver，两层一致处理 aliases、section props、header 与 `fullPageTabs`。

### Layer、工具与验证

- 新增 `@lilia/ui/provider` 与 `@lilia/nana-ui/preset/definition`，两个 Layer 对齐公共核心 subpath 和 peer dependency 策略；设计专属 Runtime、Diagnostics、Workspace、Consumer patterns 与 State 保持独立。
- 边界检查改为双向扫描 Professional/Consumer Layer；迁移工具报告已移除的旧 Shell 调用，新增双 Layer framework conformance 和 Shell/Provider/Settings 性能场景。

## 2026-07-18 — 重构后稳定化

### Contract additive

- Contract 补全 controls、selection、overlay、feedback 与 selectable surface 的 events/slots 类型；Professional 与 Nana 实现统一继承 Contract props，并冻结 Input 字符串 emit 与 Select typed value emit 语义。

### Foundation

- 新增 `useRovingFocus`、`useTabsPrimitive` 与 `useSegmentedControlPrimitive`，统一方向键、Home/End、disabled 跳过、默认 tabbable item、主动 focus、动态与空 options。
- settings 改用中性 `NavigationTarget`，Foundation 移除 `vue-router` peer dependency。

### Lilia 与 Nana Layer

- 两层 controls、overlays、feedback、Tabs/Segmented 与 selectable surfaces 通过同一行为 fixture；Native Appearance 改为浏览器安全 adapter，Tauri 实现移入显式 `@lilia/ui/runtime/tauri`。
- `@lilia/ui` 移除无约束 wildcard exports，新增 calendar、search、overlay 等职责 subpath 和非法内部路径检查。
- 新增 `@lilia/ui/shell/app`、`@lilia/ui/shell/sidebar`、`@lilia/ui/shell/config` 窄入口，避免兼容 `@lilia/ui/shell` barrel 的未使用 Shell CSS 进入新消费模板。
- 新增无 Shell side effect 的 `@lilia/ui/preset/definition`，供新模板显式组合 `LiliaAppShell + Workspace Regions`；兼容 preset 继续保留 Legacy Shell。
- 新增 `@lilia/ui/settings/sidebar`，避免 Shell 静态导入 settings barrel 后合并设置页异步 chunk。
- 已具备公共组件命名空间的样式去除重复 Vue scope 属性，保持选择器语义同时收回默认消费端 CSS 体积。

### Tooling and migration

- `ui-migrate --check` 明确识别 Legacy Shell，并提示迁移到 `LiliaAppShell + Workspace Regions`；旧 Shell 最后支持 `0.2.x`，仅在 `0.3.0` breaking release 移除。

### Validation and performance

- Workspace geometry 改为 subscriber-gated measurement，同帧 refresh 合并且 ResizeObserver 不重复 observe；增加 20/50 Region、动态状态、连续 resize 与 subscriber 对比场景。

## 2026-07-17 — Workspace Region 布局

### Lilia Layer

- `@lilia/ui/layouts` 新增 `LiliaWorkspace`、统一 `LiliaWorkspaceRegion`、六个语义预设和 `useWorkspaceRegion` 几何订阅；支持任意数量的 start/end Region、Workspace/Primary 两级顶底区域、受控状态、键盘 resize 与响应式 collapse/overlay。
- `LiliaAppShell` 收敛为窗口 Chrome、安全区、原生宿主与 Overlay Host；全局导航不再是新 Shell 的固定部件。旧 `LiliaDesktopShell` 与 `mainSidebar` 作为阶段性兼容入口保留并弃用。

### Tooling and migration

- 新增三类专业工具布局的可运行示例与固定 Shell 到 Workspace Region 的迁移文档；应用继续显式持有 Router、Region 状态与持久化协议。

### Validation and performance

- 增加单主区、多层左右 Region、顶底归属、动态邻接、响应式、几何更新和 Shell 边界功能测试，并新增轻量与真实浏览器 Workspace resize 性能基线。

## 2026-07-17 — Surface Material 与 State Layer

### Contract additive

- `@lilia/ui-contract` 新增 `SurfaceMode`、`BackdropEffect`、`SurfaceLevel` 与 Surface Boundary 契约；`@lilia/ui-foundation/surface` 提供无视觉、无 Context 的稳定 attributes 解析。

### Lilia 与 Nana Layer

- 两套 Layer 新增 Solid/Translucent 状态 Token，并统一迁移 Sidebar/Tree、Navigation/List、Menu、Tabs/Segmented、Select/Command Palette、Interactive Card 与 Toolbar Toggle。
- 选中和焦点不再只依赖背景色；Backdrop 只由显式 Surface 拥有，Reduced Transparency 与高对比模式回退到不透明状态色。

### Validation and performance

- 新增双 Surface 视觉 fixture、真实浏览器材质/合成边界检查，以及 240 行 State Layer 长列表浏览器性能场景。

## 2026-07-16 — Consumer UI Layer

### Contract additive

- 新增 `@lilia/ui-contract`，统一控件、overlay、surface、navigation、feedback、policy 与 preset adapter 契约。
- `@lilia/ui` 与 `@lilia/nana-ui` 可以用同一份 Contract fixture 完成类型检查与生产构建。

### Foundation

- 新增 `@lilia/ui-foundation`，承载 button、field、focus、dialog、dismissable layer、anchored position、tooltip、sidebar、responsive、theme、commands 与 settings 的共享行为。
- Foundation 不依赖任一完整 UI Layer，两个 Layer 也不互相依赖。

### Lilia Layer

- Professional Layer 补齐 Contract 兼容的表单、surface、overlay、feedback 组件，同时保留既有 `Ui*` API。
- commands/settings 的共享行为下沉到 Foundation，既有 subpath 继续可用。

### Nana Layer

- 新增独立的 `@lilia/nana-ui` 包、Provider、Theme、Policy、基础组件、Consumer 组件、Shell、Sidebar、页面 Pattern、反馈恢复与状态管理。
- Pattern、恢复反馈与 expressive 入口支持异步组件及独立样式 chunk；基础入口可 tree-shake 掉 Shell、Pattern 与 Consumer 实现。

### Tooling and migration

- `app.config.json` 新增 `ui.preset`、density、layout 与 onboarding 校验和类型契约。
- `lilia-tools ui-preset` 支持 lilia/nana 与 local/remote 两个独立维度，并提供 status、check、dry-run、事务回滚和幂等切换。
- `lilia-tools ui-migrate` 仅迁移可证明安全的 facade/import/config，遇到未知 Contract 或信息架构决策时停止并报告。

### Validation and performance

- 新增双 Layer Contract fixture、Nana 四页面异步构建示例、依赖边界检查、a11y、视觉、状态机、tree-shaking 与动态 chunk 验证。
- Professional 与 Nana 的公共组件均纳入轻量性能场景；overlay 与 Shell 另有真实浏览器交互基线。

### Migration

- 消费应用应经本地 `src/ui` facade 导入 UI，并显式声明 Layer、Contract 与 Foundation。
- Git workspace 依赖应锁定到同一完整 commit；完整步骤见 [迁移文档](./docs/ui-layers/migration.md)。
