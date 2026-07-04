---
doc_type: feature-design-review
feature: 2026-07-03-ecs-lifecycle-surface-harden
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-lifecycle-surface-harden design 审查报告

## 1. Scope And Inputs
- Design: `ecs-lifecycle-surface-harden-design.md`、checklist
- 硬约束：roadmap §5 第4条、模块 D
- Code facts: `src/utils/docs-pipeline.ts:24`（4 targets）、`scripts/check-docs.ts`、skills-scaffold/shell-completion 测试

### Independent Review
- Status: completed；Detection: paseo；Provider: `codex/gpt-5.5`（agentId d18619e6）
- Merge policy: 逐条核验；round-1=changes-requested（1 blocking），修复后 round-2 passed

## 2. Findings

### blocking
- [x] docs pipeline 4 targets 认知错误：核验 docs-pipeline.ts:24——实际 targets 是 README/agent-surfaces/scenarios02/scenarios03，**不含 skill/completion**
  - Impact: 原设计用"docs:check 4 targets 通过"冒充 skill/completion 已同步，验收不可证伪
  - Resolution: §0 术语表、§1 决策2、§3 H1/H2a/H2b/H2c 拆开：docs:sync/check 只证 README/agent-surfaces/scenario；skill 由 skills-scaffold.test、completion 由 shell-completion.test 分别证明

### important
- [x] "依赖 stop/delete 已合入"缺可执行 gate：新增 H0 前置 gate（命令已在 registry/catalog/help 且 stop/delete acceptance passed 否则 blocked）+ checklist step/check
- [x] 跨命令 verify 契约覆盖不够细：新增 H8（verify.statusClass/reachedTarget/timedOut + delete notFound + dry-run execution 缺省形状稳定）

### nit
- [x] CMD-004 ecs-lifecycle-command.test.ts 当前不存在：由前置 lifecycle feature 提供，H0 gate 已保证依赖顺序下存在

### suggestion
- [x] 拆 4 类 surface 证据：已在 §1/§3 按 docs/skill/completion/catalog 分别落证据入口

### learning
- `docs:check` 的"4 targets"只是 docs-pipeline 目标数，不等于所有 surface；completion 是运行时 command graph 解析，skill 是 committed scaffold sync 测试

### praise
- 范围守护清晰（不改 provider/harness、不新增命令行为、diff 只含 docs/tests/seed）

### residual-risk
- 未审实现 diff（当前 worktree 只有 .codestable 设计文件）；"diff 只含 docs/tests/seed"由 acceptance 阶段核验
- 依赖 stop/delete 前置 feature 合入，H0 gate 在 implement 前用真实 registry 复核

## 3. Verdict
- Status: passed
- Next: 返回 cs-epic 批量流程，design 保持 draft
