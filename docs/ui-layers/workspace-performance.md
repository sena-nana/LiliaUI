# Workspace 性能基线

## 稳定化结论

`LiliaWorkspace` 的 geometry 测量按订阅启用：没有 `useWorkspaceRegion()` 消费者时只测量 Workspace 根元素；Region 首次订阅后才读取 rect 并注册 `ResizeObserver`，最后一个订阅释放时立即停止观察。连续刷新合并到同一 animation frame，动态插入、隐藏、折叠和 overlay 布局仍由布局刷新覆盖。

单元测试的可观察结果：

- 20 个未订阅 Region 挂载和更新时，Region `getBoundingClientRect()` 调用数为 `0`；
- 仅订阅 1 个 Region 时，只观察 Workspace 根元素和该 Region 各 1 次；连续 8 次刷新合并为该 Region 1 次 rect 读取；
- 订阅释放后会 `unobserve`，清空暴露 geometry，不再继续测量。

## 浏览器基线

环境：Windows、系统 Microsoft Edge（Playwright Chromium API）、1280×800、7 次采样。数值为 p95，单位为 ms；DOM 为节点数。历史列来自本次修改前提交的 browser baseline，新场景标为“新增”。

| 场景 | 历史 mount | 当前 mount | 历史 update | 当前 update | interaction | DOM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `LiliaWorkspace` | 0.6 | 3.5 | 0.4 | 2.9 | 0.1 | 19 |
| `LiliaWorkspaceStatic20` | 新增 | 7.1 | 新增 | 0.8 | 0 | 62 |
| `LiliaWorkspaceStatic50` | 新增 | 23.5 | 新增 | 2.5 | 0 | 152 |
| `LiliaWorkspaceGeometrySubscribers20` | 新增 | 6.0 | 新增 | 0 | 0 | 62 |
| `LiliaWorkspaceDynamic50` | 新增 | 23.3 | 新增 | 10.8 | 0 | 0 | 152 |
| `LiliaWorkspaceContinuousResize` | 新增 | 1.4 | 新增 | 0.7 | 14.9 | 8 |

历史场景的 DOM 数保持 19；计时仍低于既有阈值。新增场景覆盖 20/50 Region 静态挂载、订阅开关、动态插入/隐藏/折叠/overlay 和 12 次连续 resize。阈值保持 `4x + 20ms` 与 DOM `1.25x + 8`，没有放宽。

更新基线使用：

```bash
pnpm perf:components:update-baseline
```

日常门禁继续使用 `pnpm perf:components:light`；真实浏览器检查使用 `pnpm perf:components:browser`。

