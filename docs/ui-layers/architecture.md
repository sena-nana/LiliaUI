# UI 分层架构

## 目标

本仓库官方只提供 Professional Layer（`@lilia/ui`）。Contract / Foundation 定义可复用类型与无视觉 primitive。业务应用若需要不同视觉风格，应自行实现样式分叉，不得依赖已移除的 `@lilia/nana-ui`。

## 依赖方向

```text
@lilia/ui-contract
        ↑
@lilia/ui-foundation      @lilia/theme   (无 Vue、无 Tauri，纯 CSS + DOM helper)
        ↑                      ↑
              @lilia/ui  ──────┘
                  ↑
             application
```

- `@lilia/ui-contract` 只定义类型和稳定组件调用契约，不依赖 Vue 组件实现或具体视觉层。
- `@lilia/ui-foundation` 依赖 Contract，提供 commands、settings、focus、overlay、responsive、sidebar、theme sync 等可复用 primitive。
- `@lilia/theme` 是本仓库**唯一视觉事实源**：design token、state layer、reset、字体契约、基础布局 CSS（workspace/sidebar/page/app-shell/scrollbar）与框架无关的 `applyTheme` helper。不依赖 Vue、Tauri、Contract、Foundation，可被任意（含无 Vue）消费方单独依赖。
- `@lilia/ui` 直接依赖 Contract/Foundation 与 `@lilia/theme`，是本仓库唯一官方视觉 Layer；它 re-export `@lilia/theme` 的 CSS 与 helper，自身不再维护第二份 token/基座样式源。
- `@lilia/config`、`@lilia/tools`、`@lilia/build` 与 `tauri-plugin-lilia` 是共享工程边界。

禁止的方向：

```text
ui-contract  ─X→ ui-foundation / ui
ui-foundation ─X→ ui
```

## 包职责

| 包 | 负责 | 不负责 |
| --- | --- | --- |
| `@lilia/ui-contract` | Props、events、slots 相关类型，Policy/Preset 类型 | CSS、Vue 实现、产品默认值 |
| `@lilia/ui-foundation` | 无视觉 primitive、共享 commands/settings、状态机 | 视觉实现、业务页面 |
| `@lilia/theme` | 唯一视觉事实源：token、state layer、reset、字体契约、基础布局 CSS、框架无关 `applyTheme` | Vue/Tauri 依赖、组件实现、业务样式 |
| `@lilia/ui` | Professional 组件、Router-free Shell、Policy Provider、Settings、诊断；re-export `@lilia/theme` | 第二份 token/基座样式、应用业务协议、业务样式分叉 |
| `@lilia/tools` | 默认资源、模板检查、周边 CLI、license manifest | 自动判断业务信息架构、样式分叉实现 |

## Theme 与 UI Policy

Theme 回答“界面如何呈现”，由 `@lilia/theme` 的 CSS token 表达（唯一事实源）：

- light/dark 表面、文字、边界与语义颜色；
- comfortable/compact 的尺寸与间距；
- 圆角、阴影、排版、motion duration/easing；
- `prefers-reduced-motion` 下的视觉降级。

UI Policy 回答“界面默认如何工作”，由 `UIPolicy` 明确注入：

- 高级设置默认折叠或可见；
- 错误恢复动作与面向用户的影响说明；技术诊断只保留给日志/诊断边界，不在公共 UI 展示；
- 选中状态、反馈强度和侧栏默认模式；
- 破坏性操作由 confirm/undo 还是应用自行处理。

不得通过读取 CSS 值推断 Policy，也不得用 Policy 改写 success/warning/error 的基础语义。产品强调色可以变化，语义颜色含义不能变化。

## 所有权判断

通用组件契约、primitive、主题、UI Policy Provider、Router-free Shell 与组合 Shell 属于本仓库。Vue App、Router、业务页面、业务 provider 协议、业务状态、导航信息架构、应用专属 Tauri 命令与业务样式分叉属于消费应用。

官方配置契约仅维护 `ui.preset = "lilia"`，并拒绝 `nana` preset 与原 Nana 页面 `layout`。preset 与依赖来源的切换由消费应用自行管理；本仓库不再提供自动迁移/切换工具。

相关文档：[Contract 与组件分类](./component-contract.md)、[Surface Material 与 Interaction State Layer](./surface-material.md)、[迁移边界](./migration.md)。
