# 兼容入口与弃用生命周期

| API | 分类 | 替代入口 | 最后支持版本 | 计划移除 |
| --- | --- | --- | --- | --- |
| `LiliaDesktopShell` / `NanaDesktopShell`(旧 Router-owning 实现) | 已移除的 Router-owning 实现 | Router-free 组合 `LiliaDesktopShell` / `NanaDesktopShell`(`@lilia/ui/shell`、`@lilia/nana-ui/shell`) | 已结束 | 当前 breaking release 已移除并复活为组合 Router-free Shell |
| 旧 `NanaAppShell` navigation/context props | 已移除的 Router-owning 实现 | Router-free `NanaAppShell` + 应用组合 `NanaSidebar`,或直接用 `NanaDesktopShell` | 已结束 | 当前 breaking release 已移除 |
| `useShellSidebar`、`@lilia/ui/styles/shell.css` | 已移除的 legacy `.shell` grid 编排 | `LiliaWorkspaceRegion` 的 `collapsible`/`v-model:collapsed`/`resizable` | 已结束 | 当前 breaking release 已移除 |
| `LiliaUiConfig.sidebar.nav`/`groups`/`globalActions`/`topContent`/`navTitle`、`SIDEBAR_NAV`/`SIDEBAR_GROUPS`/`SIDEBAR_GLOBAL_ACTIONS`/`SIDEBAR_TOP_CONTENT`/`SIDEBAR_CONFIG` | 已移除的配置驱动侧栏 store(无渲染者) | 应用直接向 `LiliaSidebarNavRow`/`LiliaSidebarSection` 传入 `SidebarNavItem`,或用组合 Shell / Workspace Region 组合 | 已结束 | 当前 breaking release 已移除 |
| `lilia-tools ui-migrate`、`lilia-tools ui-preset`、`@lilia/tools/ui-migrate`、`@lilia/tools/ui-preset`、消费端 `src/ui/LegacyShell.vue` / `src/ui/legacy-shell.ts` | 已移除的自动迁移/切换工具与迁移骨架 | 应用直接使用组合 Shell 或手动组合 Region;preset/来源切换由应用自行管理 | 已结束 | 当前 breaking release 已移除 |
| `components/<name>`、`composables/<name>` 历史路径 | 显式兼容入口 | 职责 subpath,见 `public-api.md` | `0.2.x` | 最早 `0.3.0`,逐项 breaking changelog |
| `Button` / `UiButton` 等双名称 | 长期 Contract alias | 无需迁移 | 长期保留 | 无计划移除 |
| `createLiliaSettingsModel` / `createSettingsModel` 等双名称 | 长期 Layer alias | 无需迁移 | 长期保留 | 无计划移除 |

迁移工具已移除:本仓库不再向消费仓库生成 `src/ui/LegacyShell.vue` 与 `src/ui/legacy-shell.ts`,也不再重新导出 `LegacyAppShell` / `LiliaDesktopShell` / `NanaAppShell` / `NanaDesktopShell` 旧名字。需要旧 Shell 体验的应用直接使用公共包内组合好的 `LiliaDesktopShell` / `NanaDesktopShell`,或用 `LiliaAppShell` / `NanaAppShell` 与 Workspace Region / `NanaSidebar` 手动组合;业务导航与路由表始终由应用持有,不进入公共包。
