---
doc_type: feature-review
feature: 2026-07-03-ecs-lifecycle-command-scaffold
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-03
round: 1
---

# ecs-lifecycle-command-scaffold 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-evidence.json`
- Gate results: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-scope-before-review.json`
- DoD results: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-dod-before-review.json`
- Implementation evidence: 当前 diff、seed 文档、guard tests、已运行验证命令
- Diff basis: `git status --short` 显示本轮仅修改 Feature 7 checklist、goal state、ECS surface/auth/RAM tests，并新增 lifecycle seed 与 gate evidence
- Baseline dirty files: none

### Independent Review

- Detection: Paseo subagent 可用；OCR CLI 可用。
- 环节 A 独立隔离 Task agent: paseo completed，agent id `d5adc10b-b333-495e-9dbd-d708283ed7a0`。
- 环节 B OCR CLI: completed，初次 0 comments；处理 reviewer nit 后二次扫描 0 comments。
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded。
- Merge policy: Paseo 与 OCR 结果已逐条本地核验后合并；Paseo 的 N1/R1 已在 review 后小修中处理。
- Gate effect: started lanes 均完成，不阻塞最终 verdict。

## 2. Diff Summary

- 新增：`.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md`
- 新增：Feature 7 before-review DoD/scope/evidence JSON。
- 修改：`src/__tests__/command-reference.test.ts`、`src/__tests__/command-surface-metadata.test.ts`、`src/__tests__/cli-help-json-contract.test.ts`、`src/__tests__/shell-completion.test.ts`
- 修改：`src/__tests__/auth-recovery.test.ts`、`src/__tests__/ram-bootstrap.test.ts`
- 修改：Feature 7 checklist 与 roadmap goal state。
- 风险热点：权限边界与 command surface 负向守卫；无 production ECS command/provider 改动。

## 3. Adversarial Pass

- 假设的生产 bug：本 feature 悄悄暴露 `ecs start/stop` 半命令，或提前把实例 lifecycle RAM action 加入只读 epic。
- 主动攻击过的反例：裸 key `ecs start`、带前缀 `licell ecs start`、completion 子命令泄漏、auth capability 扩权、bootstrap policy 加入 `StartInstance` 等实例 lifecycle action、seed 文档被误读为当前用户指南。
- 结果：未发现 production 泄漏。Paseo 指出的裸 key 正则覆盖较窄已修复为 `(?:licell )?ecs ...`；seed 中“mutating ECS action”措辞已收紧为“实例生命周期 mutating action”。

## 4. Findings

### blocking

none

### important

none

### nit

- [x] REV-001 `src/__tests__/cli-help-json-contract.test.ts:6` / `src/__tests__/command-reference.test.ts:10` lifecycle 正则原先要求 `licell ` 前缀，对裸 key `ecs start` 覆盖不足。
  - Evidence: Paseo reviewer N1。
  - Disposition: 已改为 `(?:licell )?ecs ...`，重跑相关测试通过。

- [x] REV-002 `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md` RAM policy 文案原先容易被理解成“不含任何 ECS mutating action”，与既有 `ecs:CreateSecurityGroup` 事实不够精确。
  - Evidence: Paseo reviewer R1；`LICELL_POLICY_ACTIONS` 中已有 security group 创建权限。
  - Disposition: 已收紧为“不含实例生命周期 mutating action”，并注明既有安全组创建权限不属于 lifecycle seed 范围。

### suggestion

- 后续若要进一步强化 policy 侧 guard，可对 `LICELL_POLICY_ACTIONS` 中 `ecs:` 前缀子集做排序后的精确集合断言，确保任何新增 ECS action 都必须显式更新测试。

### learning

- 这类 design-seed feature 的关键不是提前实现 runtime，而是把未来风险写成可消费的 feature seed，并用真实 command graph / auth / RAM 函数建立负向守卫。

### praise

- 负向守卫作用于真实生产函数与 CLI help 进程，而不是 mock seam。
- seed 文档明确记录了 confirmation helper 文案和 `confirmFlags` 自动收集边界，能直接服务后续 lifecycle feature 设计。

## 5. Test And QA Focus

- QA 必须重点复核：当前 command catalog/help/reference/completion 仍只暴露 `ecs list/info`。
- QA 必须重点复核：auth action hints 精确等于 ECS Describe 白名单；bootstrap policy 不含实例 lifecycle action。
- Evidence pack residual risks / gate warnings：无未解释 blocking；review nit 已处理。
- 建议新增或加强的测试：后续 lifecycle feature 可考虑 policy ECS action 子集白名单。
- 不能靠 review 完全确认的点：未做真实云调用；本 feature 不实现云端 mutating 行为，因此不需要 live ECS 验证。

## 6. Residual Risk

- 当前 lifecycle action guard 仍主要是具名黑名单；auth capability 侧已有精确白名单兜底，RAM policy 侧保留既有 security group action，不能简单声明 ECS action 全白名单。

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` QA 阶段。
