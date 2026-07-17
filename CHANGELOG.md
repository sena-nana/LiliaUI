# Changelog

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
