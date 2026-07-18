# 兼容入口与弃用生命周期

| API | 分类 | 替代入口 | 最后支持版本 | 计划移除 |
| --- | --- | --- | --- | --- |
| `LiliaDesktopShell` / `LegacyAppShell.vue` | 已移除的 Router-owning 实现 | `LiliaAppShell` + `@lilia/ui/layouts` Workspace Regions | 已结束 | 当前 breaking release 已移除 |
| `NanaDesktopShell`、旧 `NanaAppShell` navigation/context props | 已移除的 Router-owning 实现 | Router-free `NanaAppShell` + 应用组合 `NanaSidebar`/Router/pattern | 已结束 | 当前 breaking release 已移除 |
| `components/<name>`、`composables/<name>` 历史路径 | 显式兼容入口 | 职责 subpath，见 `public-api.md` | `0.2.x` | 最早 `0.3.0`，逐项 breaking changelog |
| `Button` / `UiButton` 等双名称 | 长期 Contract alias | 无需迁移 | 长期保留 | 无计划移除 |
| `createLiliaSettingsModel` / `createSettingsModel` 等双名称 | 长期 Layer alias | 无需迁移 | 长期保留 | 无计划移除 |

`ui-migrate --check` 会识别已移除的命名 Shell，以及仍向 `NanaAppShell` 传递 navigation、sidebar 或 context props 的调用，并报告应用需要显式组合 Router、导航和布局。无法安全重建信息架构的调用只报告，不自动改写。
