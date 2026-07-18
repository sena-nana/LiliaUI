# Component Contract 与兼容策略

公共入口清单、逐组件审计结果与输入值 emit 语义见 [Public API 与稳定化审计](./public-api.md)。兼容入口生命周期见 [兼容入口与弃用生命周期](./deprecations.md)。

## Contract 的稳定面

`@lilia/ui-contract` 的根入口和显式 subpath 是跨 Layer 的类型级稳定面：

- `./controls`：Button、Input、Textarea、Select、Checkbox、Switch、Slider、FormField、ValidationMessage；
- `./overlays`：Dialog、Drawer、Popover、Tooltip；
- `./feedback`：Toast、Progress、Skeleton、StatusBadge；
- `./navigation`：Tabs、Sidebar 等导航结构；
- `./surfaces`：Card、InteractiveCard、ListItem 等表面；
- `./policy`：`UIPolicy` 与 `UIPreset`；
- `./app`：`AppUIPresetAdapter` 与 Provider 值契约。

稳定意味着：相同 Contract 调用方式可以分别由 Professional/Consumer Layer 实现；不意味着两个 Layer 的 DOM、CSS class、视觉截图或默认 Policy 相同。

## 组件分类

| 分类 | 示例 | 兼容要求 |
| --- | --- | --- |
| Contract 基础组件 | Button、Input、Dialog、Toast、Tabs、Card | Props/events/slots/v-model 保持类型和行为兼容 |
| Foundation 能力 | commands、settings、dismissable layer、focus、responsive、sidebar primitive | 两个 Layer 复用同一实现或同一状态机 |
| Layer Shell | Lilia Desktop Shell、Nana App Shell | 都通过 preset adapter 暴露，但允许不同布局结构和默认值 |
| Lilia-only | diagnostics、专业高密度工具布局、细粒度 composable | 不承诺 Nana 等价入口 |
| Nana-only | Consumer patterns、recovery、progressive settings、expressive、undo feedback | 不加入 Contract，除非出现第二个独立实现需求 |
| 应用业务 | routes、业务 workflow、数据模型、业务 provider | 不进入公共 Layer 或 Contract |

## 兼容规则

- 新增可选 prop、event、slot 或新组件属于向后兼容变更。
- 改变默认交互时，先判断是 Layer Policy 变化还是 Contract 行为变化；Contract 行为变化需要两个 Layer 一起验证。
- 不以 CSS class、内部 DOM、私有文件路径或组件实现名称作为 Contract。
- 根入口只导出稳定常用能力；Layer-only 能力使用明确 subpath，避免根入口持续膨胀。
- `@lilia/ui` 保留既有 `Ui*` 名称；Contract alias 的增加不能无计划移除旧名。
- `commands`、`settings` 等共享运行时能力位于 Foundation，由两个 Layer 的稳定 subpath 转发。

## 弃用流程

1. 在新 API 可用后再标记旧 API deprecated，不做“先删除后迁移”。
2. Changelog 记录替代入口、迁移示例、影响的 Layer 与计划移除版本。
3. 至少跨一个兼容发布周期保留旧入口；0.x 阶段也不以“尚未 1.0”为由静默破坏。
4. `ui-migrate --check` 能识别的弃用应进入结构化 `Contract incompatibilities`；无法安全转换的内容只报告，不强写。
5. 移除前更新双 Layer 类型 fixture、包导出检查、迁移 fixture 与消费模板验证。
6. 真正移除只发生在显式 breaking release，并在 Changelog 的 `Contract breaking` 分类中列出。

## 变更 Contract 的评审问题

- 这是跨 Layer 的稳定能力，还是单个 Layer 的产品表达？
- 两个实现能否在不复制业务语义的情况下遵守相同调用契约？
- 是否需要 Foundation primitive 支撑一致的键盘、焦点或状态行为？
- 旧调用是否仍能编译和运行？若不能，弃用与迁移证据在哪里？
- 新导出是否有类型、功能、无障碍、包导出和性能证据？

验证入口见 [质量验证矩阵](./verification.md)。
