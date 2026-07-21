# LiliaUI

LiliaUI 是 Lilia 桌面应用生态的公共 UI、配置、工具、构建与 Tauri 运行时源码仓库。专业工具界面使用 `@lilia/ui`，面向普通用户的任务型界面使用 `@lilia/nana-ui`；两者共享 Contract、Foundation 以及 Router-free Preset/Provider/Shell/Settings 框架，但一次产品构建只选择一个完整 UI Layer。

## 文档入口

- [设计标准](./DESIGN.md)
- [UI 分层架构与 Theme/Policy 边界](./docs/ui-layers/architecture.md)
- [Component Contract、稳定性与组件分类](./docs/ui-layers/component-contract.md)
- [公共 API 与职责 subpath](./docs/ui-layers/public-api.md)
- [弃用与兼容生命周期](./docs/ui-layers/deprecations.md)
- [Workspace 性能基线](./docs/ui-layers/workspace-performance.md)
- [版本、发布与 Changelog 策略](./docs/ui-layers/release.md)
- [本次变更记录](./CHANGELOG.md)
- [Preset 与应用迁移边界](./docs/ui-layers/migration.md)
- [Contract、包导出与质量验证矩阵](./docs/ui-layers/verification.md)

仓库级最低验证为：

```bash
yarn typecheck
yarn test
```
