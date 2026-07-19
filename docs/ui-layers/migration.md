# Preset 与应用迁移边界

桌面工作区从固定 Shell 侧栏迁移到统一 Region 的步骤见 [Workspace Region 布局与迁移](../workspace-regions.md)。旧 Router-owning Shell 已移除；Lilia 应用使用 `LiliaAppShell` 与 Workspace Regions，Nana 应用使用 `NanaAppShell` 并显式组合 Router、NanaSidebar 与任务布局。

## 两个独立维度

UI preset 与依赖来源互不替代：

| 维度 | 值 | 负责内容 |
| --- | --- | --- |
| preset | `lilia` / `nana` | Layer 依赖、facade、样式、preset adapter、density/config |
| source | `local` / `remote` | workspace 包来自 portal/link 还是同 commit Git 依赖 |

切换 preset 不应把 local 强制改成 remote；切换来源也不应把 Nana 改回 Lilia。

## 应用 facade

消费应用以以下本地入口隔离具体 Layer：

```text
src/ui/
├── index.ts
├── preset.ts
├── contract.ts
└── styles.css
```

- feature 从本地 `src/ui` 导入基础组件和类型。
- app/root 从 `preset.ts` 取得 `AppUIPresetAdapter.shell` 和必需 provider，并在两者内部显式组合 Router 与布局。
- main 只导入本地 `styles.css`。
- 一次构建只声明一个 `@lilia/ui` 或 `@lilia/nana-ui` 完整 Layer。

## Preset 切换

```bash
lilia-tools ui-preset status
lilia-tools ui-preset nana --dry-run
lilia-tools ui-preset nana
lilia-tools ui-preset lilia
```

切换事务覆盖：

- Layer、Contract、Foundation 的兼容依赖与同 commit revision；
- `src/ui` facade、preset adapter 和样式入口；
- `app.config.json` 的 `ui.preset` 与默认 density；
- lockfile 更新和项目最小 typecheck/build；
- 人类/JSON 变更报告。

相同 preset 重复运行不得继续产生 diff。写入、安装或验证失败时恢复 package/config/facade/lockfile，并报告恢复结果。

如果业务代码仍直接导入具体 Layer，`ui-preset` 会停止；先运行迁移检查，避免删除旧依赖后留下不可编译代码。

## 现有应用迁移

```bash
lilia-tools ui-migrate --check
lilia-tools ui-migrate --preset nana --dry-run
lilia-tools ui-migrate --preset nana
```

可以安全自动处理：

- 创建缺失的 facade/preset/contract/styles 工程入口；
- 将可解析的已知 Layer import 和 CSS 入口改到本地 facade；
- 为 `LiliaDesktopShell`、已知结构的 `LegacyAppShell`、`NanaDesktopShell` 和仍使用旧 navigation/context props 的 `NanaAppShell` 生成消费端迁移骨架，并把旧导入改到 `src/ui/legacy-shell.ts`；
- 替换 Layer 依赖并同步 app config；
- 在 `dependencies` 补齐 `@lilia/ui-contract` 与 `@lilia/ui-foundation`，并让 Layer、Contract、Foundation 沿用同一来源和 Git workspace commit；
- 更新测试中的已知 UI import；
- 执行明确的一对一 Contract 迁移。

必须停止或只报告：

- 无法解析的 Vue/TypeScript/CSS module 入口；
- 未知或目标 Layer 不支持的 subpath、prop 或组件契约；
- 已存在但不是工具生成内容的 `src/ui/LegacyShell.vue` / `src/ui/legacy-shell.ts`，以及无法确认是公共旧实现的定制 `LegacyAppShell.vue`；
- 无标记且存在命名冲突的自定义 preset adapter；
- 脏工作区的实际写入，除非用户显式 `--force`；
- 保留 Nana layout 时直接切回不支持该布局的 Lilia 配置。

禁止自动决定：

- 按技术模块名重排导航或任务步骤；
- 自动隐藏业务参数、判断 Essential/Advanced；
- 为未知错误流程伪造 recovery action；
- 删除自定义页面、样式、业务组件或数据模型；
- 仅根据颜色、Toast 或文本猜测完整业务语义。

### 旧 Shell 骨架

实际迁移会把 Router 依赖留在消费仓库，并生成目标 Layer 对应的两个受管文件：

```text
src/ui/
├── LegacyShell.vue
└── legacy-shell.ts
```

- Lilia 骨架只组合 `LiliaAppShell`、`LiliaWorkspace`、`LiliaPrimaryContent` 与消费端 `RouterView`；业务导航由应用后续放入合适的 Workspace Region。
- Nana 骨架显式组合 `NanaAppShell`、`NanaSidebar` 与消费端 `RouterView`，并保留旧 navigation、settings、sidebar、context props、events 和 slots 的本地适配面。
- 骨架只是一条可编译的迁移边界，不把 Router、路由表、导航数据或业务页面带回公共 Layer。旧 Nana context 的窄屏 Drawer 等体验仍需应用复核。
- 未修改的受管骨架可由后续迁移更新；一旦应用定制，工具会停止覆盖并报告冲突。

## 报告分类

迁移的人类与 JSON 报告保持以下稳定分类：

- Safe changes applied/available
- Manual UI review
- Contract incompatibilities
- Information architecture review
- Recovery/feedback gaps
- Bundle/style conflicts

自动迁移完成不代表专业应用已成为合格 Nana 任务体验。信息架构、渐进暴露、反馈与恢复仍需产品和业务评审。

## 脏树、回滚与恢复

- `--check` / `--dry-run` 永不写文件，可在脏树运行。
- 默认实际迁移要求干净 Git 工作区；`--force` 只表示接受脏树风险，不允许静默覆盖无法识别的自定义。
- 事务写入使用同目录临时文件替换，并在命令失败后恢复原文件和 lockfile。
- 如果依赖安装已改变本地 artifact，回滚报告会提示再次运行 `pnpm install` 与恢复后的 manifest 对齐。

版本与远端固定规则见[发布策略](./release.md)。
