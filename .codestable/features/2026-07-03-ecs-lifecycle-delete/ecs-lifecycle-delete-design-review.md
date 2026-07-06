---
doc_type: feature-design-review
feature: 2026-07-03-ecs-lifecycle-delete
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-lifecycle-delete design 审查报告

## 1. Scope And Inputs
- Design: `ecs-lifecycle-delete-design.md`、checklist
- 硬约束：roadmap §4.1（getEcsInstanceReleaseFacts）、§4.2（plan.releaseFacts）；依赖 feature1 harness
- Code facts: `src/providers/ecs/types.ts`（无释放字段）、`src/utils/cli-shared.ts`（ensureDestructiveActionConfirmed 契约）

### Independent Review
- Status: completed；Detection: paseo；Provider: `codex/gpt-5.5`（agentId fd6681c8）
- Merge policy: 逐条核验；round-1=changes-requested（无 blocking，2 important），修复后 round-2 passed

## 2. Findings

### blocking
- none

### important
- [x] FDR-001 `--yes` 与"双确认"表述歧义：核验 cli-shared.ts:198——`--yes` 直接 return 跳过 prompt，仅无 --yes+TTY 才双 prompt，非交互无 --yes 抛错。Resolution: 需求摘要与 D2/D2b/D6/checklist 改为精确三分支语义
- [x] FDR-002 surface/docs 验证边界窄：明确 generated docs 收口留给 surface-harden，本 feature 只保证 registry/catalog/help/completion 测试绿，不跑 docs:sync；checklist check 同步

### nit
- [x] FDR-003 lifecycle.ts 指代不精确：写全 `src/providers/ecs/lifecycle.ts` / `src/commands/ecs-lifecycle.ts`

### suggestion
- none

### learning
- none

### praise
- 最高风险点覆盖完整：事实不可读阻断、deletionProtection 阻断、dry-run 不调 DeleteInstance、rm/delete 一致、not-found 终态、run/create 反向守护

### residual-risk
- SDK DeleteInstance/DeletionProtection/DescribeDisks/DeleteWithInstance 字段名需 implement 核实
- `releaseBehavior` 归纳规则（系统盘/数据盘混合时 deleteWithDisks 表达）需用 SDK 实际返回结构校验
- 未越界改 feature1 harness 契约（design 明确只加 delete 分支 + releaseFacts 消费）

## 3. Verdict
- Status: passed
- Next: 返回 cs-epic 批量流程，design 保持 draft
