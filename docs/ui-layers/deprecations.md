# 兼容入口与弃用生命周期

| API | 分类 | 替代入口 | 最后支持版本 | 计划移除 |
| --- | --- | --- | --- | --- |
| `LiliaDesktopShell` / `LegacyAppShell.vue` | 已移除的 Router-owning 实现 | `LiliaAppShell` + `@lilia/ui/layouts` Workspace Regions | 已结束 | 当前 breaking release 已移除 |
| `NanaDesktopShell`、旧 `NanaAppShell` navigation/context props | 已移除的 Router-owning 实现 | Router-free `NanaAppShell` + 应用组合 `NanaSidebar`/Router/pattern | 已结束 | 当前 breaking release 已移除 |
| `components/<name>`、`composables/<name>` 历史路径 | 显式兼容入口 | 职责 subpath，见 `public-api.md` | `0.2.x` | 最早 `0.3.0`，逐项 breaking changelog |
| `Button` / `UiButton` 等双名称 | 长期 Contract alias | 无需迁移 | 长期保留 | 无计划移除 |
| `createLiliaSettingsModel` / `createSettingsModel` 等双名称 | 长期 Layer alias | 无需迁移 | 长期保留 | 无计划移除 |

`ui-migrate --check` 会结构化识别已移除的命名 Shell，以及仍向 `NanaAppShell` 传递 navigation、sidebar 或 context props 的调用。对可确认的公共旧契约，实际迁移会在消费仓库生成 `src/ui/LegacyShell.vue` 与 `src/ui/legacy-shell.ts`，显式组合目标 Layer Shell、消费端 Router 和最小布局；业务导航与路由表不会进入公共包。无法确认的定制 `LegacyAppShell.vue`、已被应用修改的迁移骨架和无法安全重建的信息架构仍只报告并阻止覆盖。
