---
doc_type: feature-design-review
feature: 2026-07-03-ecs-lifecycle-stop
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-lifecycle-stop design 审查报告

## 1. Scope And Inputs
- Design: `ecs-lifecycle-stop-design.md`、checklist
- 硬约束：roadmap §4.1-§4.5；依赖 feature1 harness 契约
- Code facts: `src/utils/cli-shared.ts`、`src/commands/module.ts`（CommandSafetyLevel）、auth-recovery/ram

### Independent Review
- Status: completed；Detection: paseo；Provider: `codex/gpt-5.5`（agentId 7af7e48a）
- Merge policy: 逐条核验；round-1=changes-requested（无 blocking，2 important），修复后 round-2 passed

## 2. Findings

### blocking
- none

### important
- [x] FDR-001 result.fields 验收不够字段级：新增 S10（help JSON result.fields 覆盖 plan.currentStatusClass/requiresConfirmation/willExecute、execution.requestId、verify.statusClass/reachedTarget/timedOut）+ checklist check
- [x] FDR-002 verify dry-run/超时语义含糊：新增 S11（dry-run execution 缺省+verify 执行前快照/skipped；执行后 transitional 超时 timedOut=true 非失败保留最后观测态）+ checklist check

### nit
- [x] FDR-003 mutating/destructive 术语：关键决策处显式区分"云端变更性质=mutating，CLI safety 分类=destructive"

### suggestion
- [x] FDR-004 字段级断言放进 cli-help-json-contract：已由 S10 + CMD-003 覆盖

### learning
- none

### praise
- stop 归 destructive + 中断文案符合类型约束；确认不复用删除 helper 关键正确；checklist 覆盖非交互无 --yes、dry-run 不触发、running-like precheck、RAM 只加 StopInstance

### residual-risk
- SDK StopInstance/ForceStop/StoppedMode 字段名需 implement 核实
- 依赖 feature1 harness 契约；若 feature1 实现偏离 design，stop 应停下调整 design 而非改 harness 签名

## 3. Verdict
- Status: passed
- Next: 返回 cs-epic 批量流程，design 保持 draft
