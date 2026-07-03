---
doc_type: roadmap-seed
roadmap: ecs-operations-support
status: current
created: 2026-07-03
---

# ECS lifecycle command seeds

## 目的

本文档是后续 ECS lifecycle feature 的输入，不是当前用户指南，也不表示任何 lifecycle 命令已经可用。当前 ECS surface 仍保持只读：`ecs list` 与 `ecs info`。

后续 lifecycle 工作必须另起 feature design，并且不得在未显式批准额外 RAM action 的情况下复用只读 `ecs` capability。

## Phase split

| Future feature | Commands | Scope | Notes |
|---|---|---|---|
| `ecs-start-reboot-command` | `start`, `reboot` | 实例电源类 mutating 操作 | 与 delete 语义拆开；必须支持 dry-run 和执行后 verify。 |
| `ecs-stop-command` | `stop` | 会造成业务中断的操作 | 即使技术上可逆，也按 high-impact 处理；必须支持 dry-run 和显式确认策略。 |
| `ecs-delete-command` | `rm`, `delete` | destructive 释放操作 | 必须支持 dry-run、`--yes`、双确认和释放行为复核。 |
| `ecs-run-create-command` | `run`, `create` | 产生费用和网络资源的创建操作 | 单独 epic 或 feature；需要 image、network、disk、security group 和 cost plan。 |

## Common preflight

后续每个 lifecycle 命令都必须遵循这个流程：

1. 从 `--region` 解析 region；未传时使用当前 auth region。
2. 使用 `getEcsInstanceDetail(instanceId, { regionId })` 读取当前实例。
3. 校验当前状态、目标状态转换和幂等性。
4. 构造结构化 plan，至少包含 `action`、`regionId`、`instanceId`、`currentStatus`、`plannedRequest`、`requiredCapabilities` 和 `willExecute`。
5. 若传入 `--dry-run`，输出 `willExecute=false` 的 plan，且不得调用 mutating ECS API。
6. 若操作属于 high-impact，执行前必须走已批准的确认路径。
7. 只有 precheck 与 confirmation 均通过后，才能调用 ECS API。
8. 执行后必须再次读取 detail 或 list，返回最终观测到的状态。

## Future command contract

| Future command | Safety level | Confirm requirement | Dry-run | Future RAM action | Precheck | Verify |
|---|---|---|---|---|---|---|
| `start <instanceId>` | `mutating` | 默认可不确认，但 automation 文案需要 review | required | `ecs:StartInstance` | 实例为 stopped-like，且不处于过渡状态 | detail 状态变为 running-like 或可接受过渡态 |
| `reboot <instanceId>` | `mutating` / high-impact | JSON automation 很可能要求 `--yes` | required | `ecs:RebootInstance` | 实例为 running-like，并提示中断风险 | reboot 过渡后 detail 回到 running-like |
| `stop <instanceId>` | `destructive` / interruption | 必须有显式确认策略 | required | `ecs:StopInstance` | 提示业务中断风险；实例为 running-like | detail 状态变为 stopped-like 或可接受过渡态 |
| `rm <instanceId>` / `delete <instanceId>` | `destructive` | `--yes` 加双确认 | required | `ecs:DeleteInstance` | 实例存在；删除保护、磁盘和释放行为必须显式 | detail 返回 not-found 或删除终态 |
| `run` / `create` | `mutating` / cost | 单独 feature 设计确认 | required | `ecs:RunInstances` 及 network、disk、image、security 相关 action | cost、image、network、security group 和 disk plan 已存在 | 新实例可通过 detail/list 读回 |

## Safety metadata requirements

后续命令 descriptor 必须显式设置：

- `safety.level`
- `safety.reason`
- `safety.confirmFlags`
- `automation.preferredOutput = json`
- `automation.explicitInputs`
- 包含 dry-run、execute、verify 阶段的 `recommendedFlow`
- 覆盖 plan、request、verification 和 final status 的结构化 `result` fields

不要只依赖命令名推断出的 safety。通用推断只是 fallback，不是 lifecycle safety contract。

## Confirmation caveats

`ensureDestructiveActionConfirmed()` 当前使用删除语义文案。`stop` 或 `reboot` 不得复用这套删除文案；实现这些 feature 时应新增通用 high-impact / interruption confirmation helper，或提供命令专属文案。

`confirmFlags` 当前只会自动收集 `--yes`、`--apply` 和 `--force`。如果未来命令新增 `--confirm-stop` 这类 flag，必须同步 surface metadata 收集规则，或在 descriptor 中显式声明，确保 help、catalog 和 completion 都能暴露该 flag。

## RAM action policy

当前只读 epic：

- `AuthCapability.ecs` 只保留 `ecs:DescribeInstances` 与 `ecs:DescribeInstanceAttribute`。
- Bootstrap policy 不得包含实例生命周期 mutating action：`ecs:StartInstance`、`ecs:StopInstance`、`ecs:RebootInstance`、`ecs:DeleteInstance` 或 `ecs:RunInstances`。当前 policy 中既有的安全组创建权限不属于本 lifecycle seed 范围，后续不得据此扩展实例操控权限。

后续 lifecycle feature 只能随对应命令加入最小所需 RAM action。Delete 和 create 操作必须与 start/reboot 分开 review。

## Future feature test requirements

后续每个 lifecycle feature 都必须增加测试覆盖：

- catalog/help/completion 只暴露当前实现的命令
- 显式 safety metadata 和 confirmation flags
- dry-run plan shape，以及 dry-run 时不调用 mutating provider
- 当前状态 precheck 和幂等性
- auth capability action hints
- bootstrap RAM policy 只包含已批准命令的 action
- 不包含无关 lifecycle actions
- 执行后 verify 行为

## Current guard requirement

在后续 feature 明确实现 lifecycle 行为之前，当前测试必须持续证明：

- command catalog/reference/help/completion 只暴露 `ecs list` 和 `ecs info`
- 当前 ECS auth action hints 等于只读 Describe 白名单
- bootstrap RAM policy 不包含实例生命周期 mutating actions
- 本 epic 没有 ECS lifecycle provider wrapper
