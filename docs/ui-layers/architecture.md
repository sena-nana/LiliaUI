# UI 分层架构

## 目标

LiliaUI Professional Layer 与 NanaUI Consumer Layer 是同仓库中的兄弟实现。它们共享类型、基础状态机与无障碍行为，但不通过运行时主题开关互相伪装，也不要求应用同时安装两套完整 Layer。

## 依赖方向

```text
@lilia/ui-contract
        ↑
@lilia/ui-foundation
      ↑       ↑
@lilia/ui   @lilia/nana-ui
      ↑       ↑
      application src/ui facade
```

- `@lilia/ui-contract` 只定义类型和稳定组件调用契约，不依赖 Vue 组件实现或具体视觉层。
- `@lilia/ui-foundation` 依赖 Contract，提供 commands、settings、focus、overlay、responsive、sidebar、theme sync 等可复用 primitive。
- `@lilia/ui` 与 `@lilia/nana-ui` 都直接依赖 Contract/Foundation，彼此不得互相依赖。
- 应用通过本地 `src/ui` facade 选择一个 Layer；业务 feature 不直接绑定具体 Layer。
- `@lilia/config`、`@lilia/tools`、`@lilia/build` 与 `tauri-plugin-lilia` 是共享工程边界，不为 Nana 创建平行版本。

禁止的方向：

```text
ui-contract  ─X→ ui-foundation / ui / nana-ui
ui-foundation ─X→ ui / nana-ui
ui           ─X→ nana-ui
nana-ui      ─X→ ui
```

## 包职责

| 包 | 负责 | 不负责 |
| --- | --- | --- |
| `@lilia/ui-contract` | Props、events、slots 相关类型，Policy/Preset 类型 | CSS、Vue 实现、产品默认值 |
| `@lilia/ui-foundation` | 无视觉 primitive、共享 commands/settings、状态机 | 专业或消费视觉、业务页面 |
| `@lilia/ui` | Professional 组件、Shell、Settings、主题和诊断 | Nana 任务流程、应用业务 |
| `@lilia/nana-ui` | Consumer 组件、Provider、Policy、Shell、patterns、恢复反馈 | Professional Layer、应用业务协议 |
| `@lilia/tools` | preset 状态、切换、迁移、事务与报告 | 自动判断业务信息架构 |

## Theme 与 UI Policy

Theme 回答“界面如何呈现”，由 CSS token 表达：

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

## 构建时单 Layer

- `src/ui/preset.ts` 暴露当前 `AppUIPresetAdapter`。
- `src/ui/index.ts`、`contract.ts` 与 `styles.css` 构成稳定 facade。
- 切换 preset 会同步依赖、facade、样式和 app config，而不是在运行时加载两个 Layer。
- `@lilia/nana-ui/lazy` 只延迟 Consumer pattern/expressive 能力，不用于同时加载 Professional Layer。

## 所有权判断

通用组件契约、primitive、主题、Policy、Shell 与迁移工具属于本仓库。路由、业务页面、provider 协议、业务状态、导航信息架构和应用专属 Tauri 命令属于消费应用。

相关文档：[Contract 与组件分类](./component-contract.md)、[Surface Material 与 Interaction State Layer](./surface-material.md)、[迁移边界](./migration.md)。
