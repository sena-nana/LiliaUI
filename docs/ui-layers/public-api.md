# Public API 与稳定化审计

## 正式入口

`@lilia/ui` 使用显式 allowlist；package exports 不含 wildcard，因此新增内部文件不会自动成为公共 API。

| 入口 | 稳定职责 |
| --- | --- |
| `@lilia/ui` | Professional Contract 基础组件与常用公共组件 |
| `@lilia/ui/calendar` | CalendarHeatmap 与纯数据模型工具 |
| `@lilia/ui/search` | Dropdown 与 SearchDropdown |
| `@lilia/ui/overlay` | OverlayHost、ContextMenuHost、AnchoredActionMenu 与 overlay activity |
| `@lilia/ui/layouts` | Workspace、Region、布局预设与 geometry 订阅 |
| `@lilia/ui/preset/definition` | 不加载任何 Shell 的 Lilia preset 元数据与默认 policy |
| `@lilia/ui/shell` | 旧消费端的兼容 Shell barrel；新代码改用以下窄入口 |
| `@lilia/ui/shell/app` | LiliaAppShell |
| `@lilia/ui/shell/sidebar` | 可组合 Sidebar frame、row 与 footer |
| `@lilia/ui/shell/config` | Shell 配置、元数据与图标解析 |
| `@lilia/ui/settings` | Settings model、provider 与页面容器 |
| `@lilia/ui/settings/sidebar` | 不加载设置页面与 section 的设置导航侧栏 |
| `@lilia/ui/runtime` | 浏览器安全、显式安装的运行时能力与 NativeAppearanceAdapter |
| `@lilia/ui/runtime/tauri` | Native Appearance 的显式 Tauri adapter |
| `@lilia/ui/commands` | 独立 command registry |
| `@lilia/ui/diagnostics` | 显式加载的 Agent Debug 与性能诊断 |

历史 `components/<name>`、`composables/<name>` 与 `layouts/PopupShell` 只对已经公开的确定路径保留显式兼容映射；不再允许通配路径。新代码使用上表中的职责入口。

`@lilia/ui/shell` 为兼容旧消费者保留，其中多个 Vue Shell export 的 CSS side effect 可能同时进入 bundle。新模板必须从 `shell/app`、`shell/sidebar`、`shell/config` 按职责导入；这样 unused Shell 不会扩大默认 CSS bundle。

新模板从 `@lilia/ui/preset/definition` 读取 policy 与 capability，再显式装配自己的 Shell；只有仍使用 Legacy Shell 的消费端才导入 `@lilia/ui/preset` 或 `LiliaDesktopShell`。

组件根 class 已使用 `ui-*`、`lilia-*`、`ctx-*`、`settings-*` 等公共命名空间时，样式保持显式组件根选择器而不重复生成 Vue scope 属性；这不会扩大选择器职责，并可避免消费 bundle 的机械性 CSS 膨胀。

LiliaTemplate 迁移后的生产构建报告为 CSS `42,755 / 42,890` bytes、4 个异步 chunk；预算与最小异步 chunk 数均未放宽。

`@lilia/nana-ui` 同样使用显式 allowlist，并提供以下桌面应用入口：

| 入口 | 稳定职责 |
| --- | --- |
| `@lilia/nana-ui` | Nana Contract 通用组件与 Provider |
| `@lilia/nana-ui/shell` | NanaAppShell、NanaTitleBar 与分组 NanaSidebar |
| `@lilia/nana-ui/settings` | Settings model、Tab 页面、外观与关于区块 |
| `@lilia/nana-ui/runtime` | 浏览器安全的 Native Appearance adapter 契约 |
| `@lilia/nana-ui/runtime/tauri` | 复用 tauri-plugin-lilia backdrop 命令的 Tauri adapter |
| `@lilia/nana-ui/diagnostics` | 与视觉 Layer 无关的 Agent Debug harness |

应用通过 `ui-preset` 生成的本地 facade 使用上述入口；业务代码不得直接混用 Nana 与 Professional Layer。

## Contract 审计结果

| 组件组 | props 基础 | 共享行为证据 |
| --- | --- | --- |
| Button / IconButton | `ButtonProps` / `IconButtonProps` | disabled、loading、invalid、click |
| Input / Textarea / Select | 对应 Contract props | ARIA、input/change、typed select value |
| Checkbox / Switch / Slider | 对应 Contract props | loading/invalid、v-model、原生 Event |
| FormField / ValidationMessage | 对应 Contract props | label、hint/error、described-by |
| Dialog / Drawer / Popover / Tooltip | 对应 Contract props | open、关闭策略、title/footer/trigger slots |
| Toast / Progress / Skeleton / StatusBadge | 对应 Contract props | live role、cancel/dismiss、可访问名称 |
| Tabs / SegmentedControl | `TabsProps<T>` / `SegmentedControlProps<T>` | 共享 roving focus、Home/End、disabled、空/动态 options |
| Card / InteractiveCard / ListItem | 对应 Contract props | selected、disabled、select/press/click |

两层行为 fixture 位于 `tests/ui/contractLayerConformance.test.ts`；双 Layer 类型与生产构建 fixture 位于 `examples/contract-layers`。

文本 Input 接受 `string | number` 作为显示值，但与原生 input 一致始终 emit `string`。Select 按 options 查回原值并保持 `string | number` 的实际类型，找不到匹配项时不发出 model update，避免运行时类型漂移。

## 平台依赖审计

- `@lilia/ui-foundation` 的 settings 使用中性 `NavigationTarget`，没有 Router 运行时或类型 peer dependency。
- Router adapter 留在 Professional/Nana 的具体页面和 Shell。
- `useNativeAppearance` 与 `@lilia/ui/runtime` 不静态导入或调用 Tauri。桌面应用从 `@lilia/ui/runtime/tauri` 显式安装 adapter；浏览器和测试在没有 adapter 时仍保持完整 CSS 状态。`@lilia/ui` 现有 TitleBar 窗口控制仍使用 Tauri API，因此包依赖保持向后兼容。
