---
doc_type: feature-design
feature: 2026-07-03-ecs-lifecycle-stop
roadmap: ecs-lifecycle-operations
roadmap_item: ecs-lifecycle-stop
status: approved
summary: 落地 ecs stop 命令，复用 lifecycle harness 与高危确认 helper，按 destructive/中断语义处理并扩展 StopInstance provider 与 RAM action
tags: [ecs, cli, lifecycle, mutating, stop, safety]
---

# ecs-lifecycle-stop feature design

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| `ecs stop` | 停止 running 实例的 mutating 命令，按 destructive/中断语义处理。 | 复用 `ecs-lifecycle-start-reboot` 的 harness；不新造编排。 |
| `stopEcsInstance` | 只发 `StopInstance` 单实例 API 的 provider wrapper。 | 与 start/reboot wrapper 同文件 `lifecycle.ts` 平级新增。 |

## 1. 决策与约束

### 需求摘要（依赖 ecs-lifecycle-start-reboot）

- 新增 `stopEcsInstance({ instanceId, regionId?, forceStop?, stoppedMode? })`（roadmap §4.1），只发 `StopInstance`。
- `EcsLifecycleAction` union 扩 `'stop'`；harness 加 stop 的 precheck（running-like）与目标态（stopped-like）。
- `ecs stop <instanceId>` 命令：`safety.level='destructive'`、`confirmFlags=['--yes']`、走 `ensureHighImpactActionConfirmed`（中断文案，`interruption:true`），非交互无 `--yes` 抛错；recommendedFlow 覆盖 dry-run→execute→verify。
- RAM 追加 `ecs:StopInstance`（决策 A）。
- guard 断言更新为暴露 start/reboot/stop，仍不暴露 delete/rm/run/create。

### 明确不做

- 不实现 delete/run/create。
- 不改 start/reboot/harness 已冻结的对外契约（只按 union/precheck 表扩 stop 分支；若需改 harness 签名，停下回 roadmap/feature1）。
- 不从 CLI 暴露 `--stopped-mode`/`--force`（provider 签名占位，MVP 走默认；如需暴露另开范围）。
- 不手改 generated docs。

### 复杂度档位

`Security=validated`：stop 造成业务中断，确认不可绕过、precheck 必须拦截非 running-like。

### 关键决策 / 假设

1. **stop 归 `destructive`**：区分两层——**云端变更性质是 mutating**（改实例电源态），但 **CLI safety 分类是 `destructive`**（现有 `CommandSafetyLevel` 无 high-impact 档，用 destructive + 中断文案表达业务中断风险，roadmap §4.5）。descriptor `safety.level='destructive'`，不要当普通 mutating 命令处理。
2. **确认走 high-impact helper 而非删除 helper**：stop 不是删除，文案须表达"停止将中断业务"，复用 feature1 的 `ensureHighImpactActionConfirmed(interruption:true)`。
3. **假设**：`StopInstance` 单实例参数名 `InstanceId`，`forceStop→ForceStop`、`stoppedMode→StoppedMode` 待 implement 核实（residual）。

## 2. 名词层与编排层

### 2.1 名词层（现状 → 变化）
**现状**：feature1 已建 `EcsLifecycleAction='start'|'reboot'`、`EcsLifecyclePlan/Result`、`EcsStatusClass`。
**变化**：`EcsLifecycleAction` 扩 `'stop'`；provider 加 `stopEcsInstance` + `EcsLifecycleActionResult`(action 含 stop)。无新结构，复用 plan/result。

示例：
```
输入: ecs stop i-x --output json（Running，非交互，带 --yes）
plan: { action:'stop', currentStatusClass:'running-like', requiresConfirmation:true, willExecute:true, ... }
execution: { requestId:'...' }
verify: { statusClass:'stopped-like', reachedTarget:true }
```

### 2.2 编排层（现状 → 变化）
**现状**：feature1 harness 已实现 read→plan→precheck→dry-run→confirm→execute→verify。
**变化**：仅在 harness 的 action 配置表加 stop 条目（precheck=running-like、target=stopped-like、requiresConfirmation=true、confirm=high-impact interruption）。命令 action 复用 harness 入口。

（编排拓扑与 feature1 §2.2 图一致，无新分支，故不重复画图。）

### 2.3 挂载点
1. `stopEcsInstance` + barrel 导出
2. `ecs stop` 命令注册
3. `CAPABILITY_ACTIONS.ecs`/`LICELL_POLICY_ACTIONS` 的 StopInstance
4. harness action 表的 stop 条目

### 2.4 推进策略
1. provider `stopEcsInstance` + 单测（StopInstance request shape）
2. harness action 表加 stop（precheck running-like、target stopped-like、confirm interruption）+ 单测
3. `ecs stop` 命令 + descriptor（destructive、confirmFlags=['--yes']）+ 单测（非交互无 --yes 抛错、中断文案）
4. RAM StopInstance + guard 更新（暴露 stop、不暴露 delete）

### 2.5 结构健康度与微重构
feature1 已把 lifecycle 落到 `src/commands/ecs-lifecycle.ts`；stop 加入同文件，**结论：不做微重构**（文件仍聚焦 lifecycle，规模可控）。目录级无变化。超出范围观察：无。

## 3. 验收契约

| # | 输入 / 触发 | 期望可观察结果 | 证据类型 |
|---|---|---|---|
| S1 | `ecs stop i-x --dry-run --output json`（Running） | willExecute=false，StopInstance 未被调用 | 单测 |
| S2 | `ecs stop i-x --yes`（Running） | 确认通过，调 StopInstance，verify 到 stopped-like | 单测 |
| S3 | `ecs stop i-x` 非交互无 `--yes` | 抛错指明需 `--yes`，不调 StopInstance | 单测 |
| S4 | stop 确认文案 | 表达"停止将中断业务"，**不含"删除"** | 单测 |
| S5 | `ecs stop i-x`（已 Stopped） | 幂等提示，不重复调 | 单测 |
| S6 | `ecs stop i-missing` | not_found 错误 | 单测 |
| S7 | verify 遇 transitional 超时 | timedOut=true 非失败 | 单测 |
| S8 | catalog/help/completion | 暴露 start/reboot/stop，不暴露 delete/rm/run/create；stop.confirmFlags=['--yes']、level=destructive | 单测 |
| S9 | RAM | 含 StopInstance，不含 DeleteInstance | 单测 |
| S10 | help JSON result.fields（stop） | 覆盖 `plan.action/regionId/instanceId/currentStatusClass/requiresConfirmation/willExecute`、`execution.requestId`、`verify.statusClass/reachedTarget/timedOut`（FDR-001） | 单测 |
| S11 | dry-run 与执行后 verify 语义 | dry-run：`execution` 缺省、`verify` 为执行前快照或 skipped；执行后 transitional 超时：`reachedTarget=false, timedOut=true`、命令非失败告警、保留最后观测状态（FDR-002） | 单测 |

**明确不做反向核对**：无 delete/rm/run/create 命令；provider 无 delete wrapper；policy 无 DeleteInstance。

### Acceptance Coverage Matrix
| 场景 | precheck | dry-run | confirm | verify | surface | RAM |
|---|---|---|---|---|---|---|
| stop | S5 | S1 | S2/S3/S4 | S2/S7 | S8 | S9 |
| 错误 | S6 | — | S3 | S7 | — | — |

### DoD Contract
- 必跑：`bun run typecheck`、ecs-lifecycle tests、manifest/help/completion/auth/ram guard tests、`validate-yaml.py`
- 证据：command_output、diff_summary、review_report、qa_report、acceptance_report
- 清洁度：禁调试输出/TODO/注释代码/死 import

## 执行风险与证据计划
- **Top 3 风险**：确认被绕过（S3/S4 缓解）；dry-run 触发 stop（S1 缓解）；stop 复用删除文案（S4 缓解）。
- **非显然依赖**：依赖 feature1 harness/helper 已合入；SDK StopInstance 参数名（residual）。
- **关键假设**：stop=destructive 表达中断（决策1）；SDK 参数名（决策3）。
- **交付物**：`lifecycle.ts`(+stopEcsInstance)、`ecs-lifecycle.ts`(+stop 命令/action)、`auth-recovery.ts`/`ram.ts`(+StopInstance)、tests。
- **清洁度**：无临时输出/TODO。
