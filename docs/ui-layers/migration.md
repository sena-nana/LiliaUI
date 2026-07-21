# Preset 与应用迁移边界

桌面工作区从固定 Shell 侧栏迁移到统一 Region 的步骤见 [Workspace Region 布局与迁移](../workspace-regions.md)。旧 Router-owning Shell 已移除;Lilia 应用可直接使用组合好的 `LiliaDesktopShell`,或用 `LiliaAppShell` 与 Workspace Regions 自行组合;Nana 应用可直接使用 `NanaDesktopShell`,或用 `NanaAppShell` 与 `NanaSidebar` 自行组合。

## 两个独立维度

UI preset 与依赖来源互不替代:

| 维度 | 值 | 负责内容 |
| --- | --- | --- |
| preset | `lilia` / `nana` | Layer 依赖、facade、样式、preset adapter、density/config |
| source | `local` / `remote` | workspace 包来自 portal/link 还是同 commit Git 依赖 |

切换 preset 不应把 local 强制改成 remote;切换来源也不应把 Nana 改回 Lilia。preset 与来源的切换由消费应用自行管理;本仓库不再提供自动切换/迁移工具。

## 应用 facade

消费应用以以下本地入口隔离具体 Layer:

```text
src/ui/
├── index.ts
├── preset.ts
├── contract.ts
└── styles.css
```

- feature 从本地 `src/ui` 导入基础组件和类型。
- app/root 从 `preset.ts` 取得 `AppUIPresetAdapter.shell` 和必需 provider,并在两者内部显式组合 Router 与布局。
- main 只导入本地 `styles.css`。
- 一次构建只声明一个 `@lilia/ui` 或 `@lilia/nana-ui` 完整 Layer。

## 使用组合 Shell

需要"导航 + 主滚动区 + 底部/footer"的典型桌面布局,直接使用组合 Shell,无需手动拼 Region:

```vue
<script setup lang="ts">
import { RouterView } from "vue-router";
import { LiliaDesktopShell } from "@lilia/ui/shell";
</script>

<template>
  <LiliaDesktopShell
    title="我的应用"
    :navigation="navigationItems"
    :footer-links="footerLinks"
    :footer-statuses="footerStatuses"
  >
    <RouterView />
    <template #bottom><ConsolePanel /></template>
  </LiliaDesktopShell>
</template>
```

Nana 侧使用 `NanaDesktopShell` 组合 `NanaAppShell` + `NanaSidebar` + 主区 + 可选 context/status:

```vue
<script setup lang="ts">
import { RouterView } from "vue-router";
import { NanaDesktopShell } from "@lilia/nana-ui/shell";
</script>

<template>
  <NanaDesktopShell
    title="我的应用"
    :navigation="navigationItems"
    :settings-item="settingsItem"
    v-model:sidebar-mode="sidebarMode"
  >
    <RouterView />
    <template #context><InspectorPanel /></template>
  </NanaDesktopShell>
</template>
```

需要非典型 Region 数量、跨列顶部工具栏或自定义响应式策略时,再退回到 `LiliaAppShell` + `LiliaWorkspace` + 各 Region 预设的手动组合,见 [Workspace Region 布局](../workspace-regions.md)。

## 报告分类(人工迁移)

消费应用从旧 Router-owning Shell 切换到组合 Shell 时,以下评审分类仍由产品与业务团队负责:

- Manual UI review
- Contract incompatibilities
- Information architecture review
- Recovery/feedback gaps
- Bundle/style conflicts

自动迁移不再由本仓库提供;信息架构、渐进暴露、反馈与恢复仍需产品和业务评审。

版本与远端固定规则见[发布策略](./release.md)。
