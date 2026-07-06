---
doc_type: feature-review
feature: 2026-07-03-ecs-lifecycle-stop
reviewer: subagent
status: passed
reviewed: 2026-07-04
---

# ecs-lifecycle-stop feature review

## 1. 范围与输入

独立只读复核，未改任何代码。输入全部读取：

- Design：`.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design.md`（第 3 节 S1-S11、决策 1/2/3）
- Checklist：`.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml`
- Evidence pack：`.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-evidence-pack.md`（DoD/gate 全 passed，CMD-001..005 exit_code=0）
- `git diff HEAD` / `git status`（feature1 已提交，feature2 未提交）

核心改动文件（均在 allowed_prefixes 内，diff 纯增量）：

- `src/providers/ecs/lifecycle.ts`：+`stopEcsInstance`（纯增量，未改 start/reboot）
- `src/commands/ecs-lifecycle.ts`：+`ecsStopCommand` + 注册（纯增量，无删除行）
- `src/commands/ecs.ts`：commands 数组 +`ecsStopCommand`，namespace 文案更新
- `src/providers/ecs.ts`：barrel +`stopEcsInstance`
- `src/utils/auth-recovery.ts`、`src/providers/ram.ts`：+`ecs:StopInstance`
- 测试：command/provider/manifest/help/completion/auth/ram guard 全部更新

## 2. S1-S11 逐项核对

| # | 结论 | 证据 |
|---|---|---|
| S1 | PASS | `ecs-lifecycle.ts:593-610` dry-run 分支提前 return，`willExecute=false`；测试 `ecs stop --dry-run ...(S1)` 断言 `stopEcsInstanceMock` 未调用、`requiresConfirmation=true`、`willExecute=false`。 |
| S2 | PASS | `ecs-lifecycle.ts:612-632` 先 `ensureHighImpactActionConfirmed('停止实例',{yes,interruption:true,...})` 后 `stopEcsInstance`，verify target `['stopped-like','transitional']`；测试 `ecs stop --yes ...(S2,S4)` 断言 confirm 入参含 `interruption:true`、`stopEcsInstance` 被调、`reachedTarget=true`。 |
| S3 | PASS | `cli-shared.ts:234-236` 非交互无 `--yes` 抛错；测试 `ecs stop throws without --yes ...(S3)` 断言 `stopEcsInstanceMock` 未调、错误含 `--yes`。 |
| S4 | PASS | 确认文案 `cli-shared.ts:235/244` 为「会中断实例运行」，无「删除」语义；命令传 `'停止实例'` label。 |
| S5 | PASS | `ecs-lifecycle.ts:569-583` 已 `stopped-like` 幂等提前 return，`willExecute=false`、不调 confirm/provider；测试 `ecs stop is idempotent ...(S5)`。 |
| S6 | PASS | not_found 由 `getEcsInstanceDetail` 抛出并经 `emitCliError` 归类；测试 `ecs stop surfaces ... not_found ...(S6)` 断言 `category:'not_found', code:'RESOURCE_NOT_FOUND'`、provider 未调。 |
| S7 | PASS（见 Finding REV-001 non-blocking） | precheck transitional 抛「过渡态…请稍后重试」，测试 `ecs stop throws when ... Starting transitional (S7 precheck)` 覆盖。post-execute transitional→`timedOut` 走共享 `pollForVerify`（`ecs-lifecycle.ts:43-81`，`timedOut=true` 非失败），但 stop 无专属 timedOut 断言。 |
| S8 | PASS | manifest/help/completion guard 更新为暴露 start/reboot/**stop**、排除 delete/rm/run/create；descriptor `safety.level='destructive'`、`confirmFlags=['--yes']`（`ecs-lifecycle.ts:274-277`）。 |
| S9 | PASS | RAM/auth 只加 `ecs:StopInstance`，不含 DeleteInstance/RunInstances；`ram-bootstrap`/`auth-recovery` 测试将 StopInstance 从 forbidden 移到 allowed。 |
| S10 | PASS | descriptor `result.fields`（`ecs-lifecycle.ts:296-311`）覆盖 `plan.action/regionId/instanceId/currentStatusClass/requiresConfirmation/willExecute`、`execution.requestId`、`verify.statusClass/reachedTarget/timedOut`。 |
| S11 | PASS | dry-run `execution` 缺省、`verify` 为执行前快照（`ecs-lifecycle.ts:594-597`）；执行后超时 `pollForVerify` 返回 `reachedTarget=false, timedOut=true` 且命令非失败、保留最后观测状态（`printLifecycleResult` 黄色告警 `:105-106`）。 |

补充核对：
- precheck 语义正确：stop 要求 `running-like`（`:586`），target `stopped-like`，verify polling `['stopped-like','transitional']`（`:630`）。
- descriptor 决策1落实：CLI `safety.level='destructive'`，云端仍为 mutating（StopInstance）。

## 3. 范围守护

- 未实现 delete/run/create：src 无 `deleteEcsInstance/runEcsInstance/createEcsInstance`、无 `ecs delete/rm/run/create` 命令（grep 仅命中无关 `redis/query.ts` 的 deleteInstance）。
- `EcsLifecycleAction` union 含 `'delete'`（`types.ts:70`）为 feature1 既有**类型**占位，无对应命令/provider/RAM，属守护范围内可接受。
- RAM 只加 `ecs:StopInstance`，不含 `DeleteInstance/RunInstances`（`ram.ts`、`auth-recovery.ts`）。
- feature1 harness 冻结契约未破坏：`lifecycle.ts` 与 `ecs-lifecycle.ts` diff 纯增量、无删除行，start/reboot 行为未改。
- 未手改 generated docs：diff 中除本 feature 的 `design.md` 外无 README/agent-surfaces 改动。
- SDK 字段核实（决策3 residual 消解）：`@alicloud/ecs20140526` `StopInstanceRequest` 确有 `instanceId?/forceStop?/stoppedMode?`；client 有单实例 `stopInstance()`（区别于批量 `stopInstances()`）。wrapper 只发 `StopInstance` 单实例。

## 4. Gate/Provider 警告

- scope-gate、dod-runner 均 passed，blocking/warnings 空。
- CMD-001..005 exit_code=0（typecheck、ecs-lifecycle、manifest/help/completion、auth/ram、yaml 校验）。
- Provider：archguard available 但未采集 risk summary（minimal 模式，非阻断）；meta_cc unavailable（out of scope）。
- 清洁度：changed src 无 TODO/FIXME/debug/注释代码/死 import。

## 5. Findings

### Blocking
无。

### Non-blocking

- **REV-001**（`src/__tests__/ecs-lifecycle-command.test.ts`，S7/S11）：stop 缺 post-execute transitional→`timedOut=true` 的专属断言。该路径由共享 `pollForVerify`（`src/commands/ecs-lifecycle.ts:75-80`）承载，start/reboot 已行使同一分支，风险低。建议后续补一条 stop verify 超时用例锁定 `timedOut=true` 且命令非失败。
- **REV-002**（`src/__tests__/cli-help-json-contract.test.ts:64`）：本次删除了 namespace `safety?.level` 的断言。代码 `src/commands/ecs.ts:456` 仍为 `'mutating'`，行为未变，但契约测试对该字段的守护变弱。非阻断，建议恢复该断言或改为显式期望值。
- **REV-003**（`src/utils/cli-shared.ts:235/244`，观察项）：`ensureHighImpactActionConfirmed` 的 `interruption` 选项当前不影响文案（有无该 flag 文案一致「会中断实例运行」）。stop 语义正确且 S4 通过，仅提示该参数目前为无副作用占位。

## 6. Test And QA Focus

- 已覆盖：S1 dry-run 不调、S2 --yes 执行+interruption confirm、S3 非交互抛错、S4 文案无删除、S5 幂等、S6 not_found、S7 precheck transitional；provider StopInstance request shape、forceStop/stoppedMode 透传、空 instanceId 拒绝、单实例不误发批量。
- 建议补充（非阻断）：stop 的 verify 超时 `timedOut=true` 用例（REV-001）；恢复 namespace safety.level 契约断言（REV-002）。
- 回归面：manifest/help/completion/auth/ram guard 已同步更新并通过，暴露面 = start/reboot/stop，delete/rm/run/create 仍不可见。

## 7. Verdict

status = **passed**。无 blocking finding；3 条 non-blocking（REV-001 测试补强、REV-002 契约断言回补、REV-003 参数占位观察）。S1-S11 全部满足，范围守护、SDK 字段、清洁度、DoD/gate 均达标。
