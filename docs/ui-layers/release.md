# 版本、发布与 Changelog 策略

## 版本模型

`@lilia/ui-contract`、`@lilia/ui-foundation` 与 `@lilia/ui` 使用独立包版本，但共享兼容队列：

- 仅 Layer 内部功能变化时，该 Layer 可以独立发布。
- Contract/Foundation 变化时，受影响的 Layer 必须在同一发布批次验证并声明兼容范围。
- major/minor/patch 依据各包公共 API 决定，不要求所有包永远使用相同版本号。
- 在 0.x 阶段，breaking change 仍必须经过弃用、迁移和显式 Changelog，不把 minor 版本当作无通知破坏许可。

## 版本递增

| 变化 | Contract/Foundation | Layer |
| --- | --- | --- |
| 内部修复、无公共行为变化 | patch | patch |
| 向后兼容的新类型、primitive、组件或 subpath | minor | 消费新能力的 Layer 至少 minor |
| 删除/重命名稳定入口、收紧既有调用、改变必要语义 | breaking | 受影响 Layer 同批 breaking |
| 纯 Layer-only pattern 或视觉能力 | 不变 | 对应 Layer minor |

Peer dependency 范围表达发布包的兼容窗口；不能只更新实现而忘记同步范围和消费 fixture。

## Changelog 分类

每个发布批次按以下类别记录，没有变化的类别可省略：

- `Contract breaking`：破坏性类型或调用契约，必须给替代方案与迁移步骤。
- `Contract additive`：新增兼容类型、基础组件契约或 adapter 能力。
- `Foundation`：共享 primitive、a11y、focus、commands/settings、状态机。
- `Lilia Layer`：Professional 组件、Shell、主题、诊断。
- `Tooling and migration`：config、build、模板检查。
- `Validation and performance`：基线、bundle、a11y、视觉或性能门禁变化。

每条记录写清受影响包、是否需要应用操作、是否有自动迁移以及最低兼容版本。

## Git workspace 的同 commit 规则

远端 Git workspace 消费必须把本次使用的 Lilia 包锁到同一个完整 commit SHA：

```json
{
  "dependencies": {
    "@lilia/build": "github:sena-nana/LiliaUI#workspace=@lilia/build&commit=<sha>",
    "@lilia/config": "github:sena-nana/LiliaUI#workspace=@lilia/config&commit=<sha>",
    "@lilia/ui-contract": "github:sena-nana/LiliaUI#workspace=@lilia/ui-contract&commit=<sha>",
    "@lilia/ui-foundation": "github:sena-nana/LiliaUI#workspace=@lilia/ui-foundation&commit=<sha>",
    "@lilia/ui": "github:sena-nana/LiliaUI#workspace=@lilia/ui&commit=<sha>",
    "@lilia/tools": "github:sena-nana/LiliaUI#workspace=@lilia/tools&commit=<sha>"
  }
}
```

- 同一应用使用的 `@lilia/*` Git workspace（包括 config/build/tools）统一指向该批次的同一 commit，至少不允许 Layer、Contract 与 Foundation 分裂。
- `head=main` 只用于安装 smoke 或开发验证；提交到应用仓库的默认远端状态使用不可变 `commit=<sha>`。
- lockfile 必须与 `package.json` 一起提交；更新后运行应用 typecheck/test/build。
- local `portal:`/link 只改变依赖来源；切回 remote 后必须恢复同 commit 锁定。

发布前不得忽略 Layer、facade、config、来源与 revision 的漂移；preset 与依赖来源的切换由应用自行管理，本仓库不再提供自动切换工具。

## 发布门禁

发布批次至少满足：

1. 全 workspace typecheck 和功能测试通过；
2. Contract 调用、包导出与依赖方向通过；
3. 受影响组件的无障碍、视觉与性能证据更新；
4. Git workspace 使用同 commit 的消费安装验证通过；
5. Changelog 与迁移文档已覆盖 breaking/deprecated 项。
