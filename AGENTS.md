# Agent 开发规范

## 仓库身份

- 本仓库是 `@lilia/*` 公共依赖源,供桌面应用模板和后续应用仓库通过 Git workspace 依赖消费。
- 消费仓库不应复制这里的通用实现;公共 UI、样式、配置、工具、默认资源和构建流程都应在本仓库维护。
- 当前公共包边界:
  - `@lilia/ui`: Vue 组件、桌面壳、设置页、主题、全局 CSS、页面基础类和交互 composable。
  - `@lilia/config`: app 配置契约、同步逻辑、可继承 TS/Vite/VitePress 配置。
  - `@lilia/tools`: 默认资源、模板检查、迁移和周边 CLI。
  - `@lilia/build`: dev/build/docs/Tauri/verify 流程封装。
  - `tauri-plugin-lilia`: Tauri 运行时公共边界,包含主窗口状态恢复、持久化和默认桌面窗口准备逻辑。

## 代码边界

- 修改前先确认改动属于哪个包;不要把 UI、配置、工具和构建逻辑混在一个入口里。
- 公共 API 要保持可被远端 Git workspace 直接消费;不要依赖本地未导出的路径或消费仓库专属文件。
- `@lilia/ui` 只承载可复用 UI 和壳层能力;应用业务页面、业务数据模型、provider、timeline、agent runner 不进入本仓库。
- `@lilia/ui` 不创建 Vue App、Router、应用 Root、业务路由或设置路由;消费应用显式组合 Root、Shell、Hosts、命令、设置 model 和可选安装器。
- 根入口只承载稳定常用组件;Shell、Settings、Runtime、Commands 和 Diagnostics 分别从明确 subpath 导入,禁止重新汇总到根入口。
- `@lilia/config` 只负责配置读取、校验、同步和可继承配置;不承担 CLI 输出和流程编排。
- `@lilia/tools` 负责面向项目的检查、资源复制、迁移和工具 CLI;不要放运行时 UI 状态。
- `@lilia/build` 负责流程封装和跨平台命令执行;不要复制 `@lilia/config` 或 `@lilia/tools` 的业务逻辑。
- `tauri-plugin-lilia` 负责 Rust/Tauri 运行时复用逻辑;不要把应用业务命令、业务状态或前端路由放进插件。
- 包间运行时依赖优先用 peer dependency,并在 devDependency 用 `workspace:*` 支撑本仓库开发;消费端必须显式声明所需 `@lilia/*` 包。
- 禁止直接修改消费仓库的 `node_modules/@lilia/*`;公共能力问题必须回到本仓库修复、验证、提交并推送。

## UI 与样式

- 所有公共视觉令牌、reset、字体声明、滚动条、selection、壳层样式和页面基础类归属 `@lilia/ui`。
- 新增公共组件时,同时考虑深浅主题、键盘可达、hover/active/disabled/loading/empty 状态和文本溢出。
- 禁止显示看起来可用但没有接入的功能;disabled 只表达真实不可用状态,不要作为路线图占位。
- 有可用图标时优先使用 `@lucide/vue`;图标按钮需要可理解的 aria label 或 title。
- 不做营销页式 hero、装饰卡片流、渐变背景或大面积单色主题;桌面工具界面保持克制、清晰、可扫描。

## Agent 友好约定

- 可由 Agent 定位和操作的稳定交互应提供 `data-agent-id`;命名应描述语义边界,不要绑定易变文案。
- `@lilia/tools` 的 `doctor` / `template-check` 是消费仓库的边界报告来源;新增关键壳层目标时同步更新检查 profile。
- `doctor` / `template-check` 默认只做最小公共检查;模板和应用在 `lilia.tools.profile.mjs` 声明自己的文件、Agent target 与入口,公共工具不得硬编码消费目录。
- 迁移工具只能迁移通用结构、默认资源和公共配置;不要把消费仓库或 Lilia 应用专属业务协议带进默认模板。

## 验证

- 公共 UI、配置、工具或构建流程变更后,至少运行:

```bash
yarn typecheck
yarn test
```

- 修改 `@lilia/build` 或跨平台 CLI 时,优先用消费模板再验证 `yarn install`、`yarn agent:debug --json`、`yarn test`、`yarn build`。
- 修改导出、包间依赖或 Git workspace 消费方式时,必须确认消费仓库能通过 `github:sena-nana/LiliaUI#workspace=<package>&head=main` 安装。
- 修改 `tauri-plugin-lilia` 后,至少运行 `cargo test -p tauri-plugin-lilia`,并用消费模板运行 `cargo check --manifest-path src-tauri/Cargo.toml`。
- 文档-only 改动可不跑测试,但最终说明要写清楚未运行原因。

## Git 提交

- 提交标题用中文短句概括结果。
- 跨包变更提交前检查 diff,确认没有把消费仓库生成物、缓存或无关依赖升级混入。
- 推送后如果消费仓库依赖本次变更,刷新消费仓库锁文件并运行相应验证。
