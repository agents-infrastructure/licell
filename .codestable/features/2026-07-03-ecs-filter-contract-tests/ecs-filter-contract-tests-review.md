---
doc_type: feature-review
feature: 2026-07-03-ecs-filter-contract-tests
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-03
round: 1
---

# ecs-filter-contract-tests 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-dod-results.json`
- Independent review: Paseo subagent `9cc11146-c2c0-4dc8-9db9-d9ed6c71dd24` completed.
- OCR review: `ocr review --audience agent ...` completed, 4 files reviewed, 0 comments.

## 2. Diff Summary

- `src/__tests__/ecs-provider.test.ts`：补 provider request shape、exact name/status casing、raw/sensitive 字段剥离。
- `src/__tests__/ecs-command.test.ts`：补 command parser、JSON payload keys、input/not-found error record、status/name 原样透传。
- `src/__tests__/cli-error.integration.test.ts`：补真实 CLI JSON 缺参 input error e2e。
- `.codestable/features/2026-07-03-ecs-filter-contract-tests/`：checklist、DoD、scope gate、evidence pack。
- 无 production command/provider/auth/RAM/doctor/generated docs 改动。

## 3. Findings

### blocking

none

### important

none

### fixed-during-review

- subagent I1：`ecs info` not-found 测试原先断言了测试自造的 `ecs.info` stage。已改为生产顶层一致的 `runtime` stage。
- subagent I2：not-found mock 文案原先与 provider 真实文案不同。已改为 `ECS instance not exist: i-missing`。
- subagent N1：checklist `checks` 已从 `pending` 同步为 `passed`。

### accepted-observations

- subagent N2：provider request shape 使用 `toMatchObject` 锁定必需字段，不严格排除所有额外字段；这是当前合同测试粒度的可接受取舍。
- subagent S1：`ecs list --tag env=` 没有真实 spawn e2e，但 command test 已通过真实 output JSON record seam 断言 input 分类，且 design 允许 `emitCliError()` seam。
- subagent S2：文本模式敏感字段缺席主要由 provider summary 白名单和 command text 渲染字段保证；当前风险低。

## 4. Test And QA Focus

- QA 必须复核 diff 仍是纯测试补强，无 production 行为改动。
- QA 必须复核 provider request shape 覆盖 roadmap filters，并证明无本地 post-filter。
- QA 必须复核 command parser 覆盖 repeatable tag、status 原样透传、name/namePrefix 互斥、IP 三拆和 instance-id CSV。
- QA 必须复核 input/not-found 分类通过 output JSON record 或 CLI JSON record，而不是只看 message。
- QA 必须复核敏感字段负向断言覆盖 provider normalization 与 command JSON result。

## 5. Residual Risk

- 部分 command error 分类仍使用 `initOutputContext` + `emitCliError` seam，而不是完整 CLI 顶层 `.catch(handleCliError)`；设计允许该 seam，且分类逻辑是真实 `output.ts`。
- Provider request shape 测试锁定关键字段，不做完整 key 集合封闭断言。

## 6. Verdict

- Status: passed
- Next: enter QA stage for `ecs-filter-contract-tests`.
