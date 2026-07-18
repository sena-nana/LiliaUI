# 兼容入口与弃用生命周期

| API | 分类 | 替代入口 | 最后支持版本 | 计划移除 |
| --- | --- | --- | --- | --- |
| `LiliaDesktopShell` | 旧架构实现 | `LiliaAppShell` + `@lilia/ui/layouts` Workspace Regions | `0.2.x` | `0.3.0` breaking release |
| `LegacyAppShell.vue` 路径 | 包内旧实现 | `@lilia/ui/shell` 的 `LiliaAppShell` | `0.2.x` | `0.3.0` breaking release |
| `components/<name>`、`composables/<name>` 历史路径 | 显式兼容入口 | 职责 subpath，见 `public-api.md` | `0.2.x` | 最早 `0.3.0`，逐项 breaking changelog |
| `Button` / `UiButton` 等双名称 | 长期 Contract alias | 无需迁移 | 长期保留 | 无计划移除 |
| `createLiliaSettingsModel` / `createSettingsModel` 等双名称 | 长期 Layer alias | 无需迁移 | 长期保留 | 无计划移除 |

`ui-migrate --check` 会识别 `LiliaDesktopShell`、`LegacyAppShell` 与 `NanaDesktopShell`，并明确报告 `LiliaAppShell + Workspace Regions` 迁移建议及 `0.3.0` 移除边界。任何 breaking removal 只能进入显式 breaking release，且必须同步 Changelog、迁移文档和消费 fixture。
