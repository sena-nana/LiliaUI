# Workspace Region 布局与迁移

## 公共边界

`LiliaAppShell` 只负责窗口级基础设施：原生标题栏与拖动、窗口控件安全区、内容安全区、原生宿主层和 Overlay Host。它不创建 Router、不选择全局导航，也不固定侧栏数量。

应用从 `@lilia/ui/layouts` 显式组合工作区：

```vue
<script setup lang="ts">
import { LiliaAppShell } from "@lilia/ui/shell";
import {
  LiliaInspector,
  LiliaPrimaryContent,
  LiliaResourcePanel,
  LiliaWorkspace,
} from "@lilia/ui/layouts";
</script>

<template>
  <LiliaAppShell>
    <LiliaWorkspace aria-label="编辑工作区">
      <LiliaResourcePanel id="files" collapsible resizable />
      <LiliaPrimaryContent id="editor">
        <RouterView />
      </LiliaPrimaryContent>
      <LiliaInspector id="inspector" collapsible resizable />
    </LiliaWorkspace>
  </LiliaAppShell>
</template>
```

只有主内容的应用不需要空导航槽或覆盖样式：

```vue
<LiliaWorkspace>
  <LiliaPrimaryContent id="content">
    <RouterView />
  </LiliaPrimaryContent>
</LiliaWorkspace>
```

## Region 契约

`LiliaWorkspaceRegion` 是唯一布局原语。所有官方预设均转发到该组件，不维护第二套布局逻辑。

- `id` 是几何订阅和 Agent 定位使用的稳定标识；同一 Workspace 内必须唯一。
- `role` 只选择默认策略和诊断语义，不替代 HTML landmark；导航仍使用 `nav`，主内容仍使用 `main`。
- `placement` 支持 `start`、`end`、`top`、`bottom`、`primary`；同一 placement 可以存在任意数量的 Region。
- `scope="workspace"` 的顶部/底部 Region 横跨全部列；`scope="primary"` 只属于主区域。
- `size` / `collapsed` 与对应 `update:*` 事件组成受控接口；`defaultSize` / `defaultCollapsed` 提供非受控初值。
- `minSize`、`maxSize` 和 `fillPriority` 描述轨道尺寸；填充轨道由网格分配剩余空间，不生成无效的 resize handle。Region 不绑定任何业务存储协议，持久化由应用持有。
- `overflow`、`hidden`、`disabled`、`collapsible` 和 `resizable` 是通用状态。`disabled` 不隐藏真实内容，只停止折叠与 resize 交互。

Workspace 自身维护外边框、背景、阴影和裁切圆角。内部 Region 不生成独立 Card；实际可见 Region 改变后，外侧边缘和内部分隔线会重新计算。

## 官方预设

| 组件 | 默认角色 | 默认位置 | HTML 语义 |
| --- | --- | --- | --- |
| `LiliaGlobalNavigation` | `global-navigation` | `start` | `nav` |
| `LiliaSectionNavigation` | `section-navigation` | `start` | `nav` |
| `LiliaResourcePanel` | `resources` | `start` | `aside` |
| `LiliaPrimaryContent` | `primary` | `primary` | `main` |
| `LiliaInspector` | `inspector` | `end` | `aside` |
| `LiliaBottomPanel` | `utility` | `bottom / primary` | `section` |

时间轴和控制台使用 `LiliaBottomPanel role="timeline"` 与 `role="console"` 表达。它们没有不同的布局行为，因此当前不增加只改名字的专用组件。

## 顶部与底部语义

- 原生标题栏属于 `LiliaAppShell`，不属于 Workspace Region。
- 应用级命令栏通常使用 `placement="top" scope="workspace"`。
- 编辑器或预览区工具栏使用 `placement="top" scope="primary"`。
- 应用状态栏使用 `placement="bottom" scope="workspace"`。
- 时间轴和控制台通常使用 `LiliaBottomPanel`，只占主区域；确需跨列时覆盖 `scope="workspace"`。

## 响应式策略

Region 通过 `narrowBehavior` 与 `collapseBelow` 声明窄窗口行为：

- `shrink`：保留在 attached 布局内并遵循最小尺寸；
- `collapse`：低于阈值时从布局中折叠；
- `overlay`：低于阈值时脱离网格，附着在 Workspace 边缘；
- `none`：不应用响应式转换。

`responsivePriority` 决定未显式提供 `collapseBelow` 时的默认阈值：优先级越高，Region 保留到越窄的窗口；显式阈值始终优先。它也决定多个响应式 overlay 的附着层级。官方预设已给出保守默认值。主区域默认具有 320px 的最低可用宽度保护，应用可通过 `minSize` 覆盖。响应式 overlay 仍属于 Workspace Region，不替代 Dialog、Popover、Drawer 等临时浮层。

## Resize 与无障碍

设置 `resizable` 后，Region 在自身邻接边生成 separator。它支持指针拖动、双击恢复默认尺寸和键盘操作：

- 方向键按 `resizeStep` 调整；按住 Shift 使用三倍步长；
- Home / End 移至最小 / 最大尺寸；
- separator 暴露 `aria-orientation`、`aria-valuenow`、`aria-valuemin` 与 `aria-valuemax`；
- 全局 pointer listener 只在实际拖动期间存在，并在结束、失焦或卸载时释放。

## 原生视口几何

在 Workspace 后代组件中调用 `useWorkspaceRegion(id)`：

```ts
const editor = useWorkspaceRegion("editor");

watchEffect(() => {
  if (!editor.visible.value || !editor.stable.value || editor.overlayOccluded.value) {
    hideNativeViewport();
    return;
  }
  syncNativeViewport(editor.safeRect.value);
});
```

返回值包含：

- `rect`：Region 当前窗口坐标；
- `safeRect`：裁切到 Workspace Surface 后的安全矩形；
- `overlayOccluded`：另一个可见响应式 Region overlay 是否与 `safeRect` 存在正面积相交；
- `visible`：当前是否参与布局或响应式 overlay；
- `stable`：最近一次布局变化后的测量是否完成。

Workspace 共享一个 `ResizeObserver`，并监听窗口与 `visualViewport` resize，以覆盖拖拽、折叠、动态显隐、DPI 与页面缩放变化。存在 geometry 订阅时，Workspace 还会惰性测量可见的响应式 Region overlay；最后一个订阅释放时立即停止 Region 观察，overlay 隐藏、折叠、卸载或退出窄窗布局后也会释放对应观察。LiliaUI 不实现 wgpu/Tauri IPC；应用只把通用几何结果传给自己的原生桥接层。

`overlayOccluded` 只描述 Workspace 自己管理的响应式 Region overlay。Dialog、Menu、Popover、Drawer 与错误提示等临时浮层继续由 `useOverlayActivity` 描述；原生子视口通常需要同时满足 geometry 可见且稳定、`overlayOccluded` 为 false、页面可见且 Overlay Activity 不活跃。

## 从旧 Shell 迁移

`LiliaDesktopShell` 与 `LiliaShellOptions.mainSidebar` 已在双 Layer 框架统一的 breaking release 中移除。消费应用按以下步骤迁移：

1. 将应用 Root、Router 与 settings provider 继续保留在应用仓库。
2. 确认应用显式声明 `@lilia/ui` 的 `@lilia/ui-contract` 与 `@lilia/ui-foundation` peer，并让所有 `@lilia/*` Git workspace 依赖固定到同一 commit；本地验证时同时 link 这两个包。
3. 用一个应用自有的布局组件组合 `LiliaAppShell` 和 `LiliaWorkspace`。
4. 把旧主侧栏内容放入 `LiliaGlobalNavigation`、`LiliaSectionNavigation` 或普通 `LiliaWorkspaceRegion`。
5. 把页面 `RouterView` 放入 `LiliaPrimaryContent`；设置页也作为业务声明的 Region 组合，不再通过 Shell route meta 替换侧栏。
6. 将侧栏宽度与折叠偏好改为 `v-model:size` / `v-model:collapsed`，由应用现有设置存储持久化。
7. 删除消费端针对 `.shell__main`、`.secondary-panel`、`leftSidebar1/2` 等内部选择器的覆盖。
8. 将应用 Root 直接切换为 `LiliaAppShell`，并确认 Shell 在未安装 Router 时也能独立挂载。

现有应用可以先运行 `lilia-tools ui-migrate --check` 查看结构化 `legacyShellMigrations`，再用带 `--preset lilia` 或 `--preset nana` 的 dry-run/实际迁移生成消费端最小骨架。工具只把旧导入改到应用自己的 `src/ui/legacy-shell.ts`；生成的 `LegacyShell.vue` 持有 `RouterView`，公共 Layer 仍保持 Router-free。缺失的 `@lilia/ui-contract` 与 `@lilia/ui-foundation` 会按目标 Layer 的依赖来源和 commit 一并补齐。

可运行示例位于 [`examples/workspace-regions`](../examples/workspace-regions)，同一页面覆盖 LiliaCode、LiliaGithub 与 Live2DEditor 三类典型组合，并用 `safeRect` 更新预览画布的 backing size。
