---
doc_type: feature-review
feature: 2026-07-03-ecs-info-command
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-03
round: 1
---

# ecs-info-command 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-dod-results.json`
- Independent review: Paseo subagent `18e6678e-d6f3-41ca-beda-190d95c81838` completed.
- OCR review: `ocr review --audience agent ...` completed, 5 files reviewed, 0 comments.

## 2. Diff Summary

- `src/commands/ecs.ts`：在既有 ECS module 中新增 `ecs info <instanceId>`，复用 `INFRA_SECTION` 和 namespace；新增 JSON 白名单 result builder 与文本详情输出。
- `src/__tests__/ecs-command.test.ts`：扩展 info success、region override、文本输出、空 instanceId、not-found JSON error record 和敏感字段负向断言。
- `src/__tests__/command-*` / `cli-help-json-contract.test.ts`：更新 registry、manifest、surface metadata、help JSON contract，锁定 list+info 且排除 lifecycle 命令。
- `.codestable/features/2026-07-03-ecs-info-command/`：checklist steps、DoD、scope gate、evidence pack。

## 3. Findings

### blocking

none

### important

none

### fixed-during-review

- subagent I-1：not-found 核心契约原先只用 `buildCliErrorRecord()` seam 断言。已补强为 command action 捕获 provider not-found 后调用真实 `emitCliError()`，并从 JSON stdout record 断言 `category=not_found`、`code=RESOURCE_NOT_FOUND`。
- subagent N-1：ECS namespace summary 仍称“详情”为后续命令。已改为“后续生命周期命令会按安全设计逐步开放”。

### accepted-observations

- subagent N-2：未传 region 时调用 `getEcsInstanceDetail(normalizedId, undefined)`，与 provider 默认 `{}` 语义等价；测试已锁定该形态，保留。
- subagent S-1：namespace recommendedFlow 由 list → info → auth repair 组成，tag 过滤引导保留在 `ecs list` command descriptor 的 examples/optionInsights。作为发现性优化，不阻塞本 feature。

## 4. Test And QA Focus

- QA 必须复核 `ecs info` 不改变 `ecs list` 行为。
- QA 必须复核 JSON result 只包含 `regionId`、`instanceId`、`detail.summary` 白名单字段。
- QA 必须复核 not-found JSON record 分类为 `not_found`，空 instanceId 分类 token 为 input。
- QA 必须复核 registry/help/catalog 只包含 `ecs list` 和 `ecs info`，没有 lifecycle 半成品命令。
- QA 必须复核 scope 没有 provider/auth/RAM/doctor/generated docs 漂移。

## 5. Residual Risk

- 白名单由命令层显式构造；若未来 provider detail 增加 raw 字段，命令层必须继续使用白名单 builder，不得直接 emit provider detail。
- Text 模式 provider error 仍由既有 `withSpinner` 打印失败并返回，不提供 JSON category；本 feature 的 not-found 契约面向 `--output json` / Agent flow。

## 6. Verdict

- Status: passed
- Next: enter QA stage for `ecs-info-command`.
