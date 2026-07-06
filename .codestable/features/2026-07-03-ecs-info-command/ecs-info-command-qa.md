---
doc_type: feature-qa
feature: 2026-07-03-ecs-info-command
status: passed
tested: 2026-07-03
round: 1
---

# ecs-info-command QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-dod-results.json`

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据 | 结果 |
|---|---|---|---|---|---|
| QA-001 | command registration | core | 复用 ECS module 追加 `ecs info`，无第二个 ECS root | manifest / registry tests | pass |
| QA-002 | execution path | core | `requiredCapabilities=['ecs']`，调用 `getEcsInstanceDetail(instanceId, { regionId })` | `ecs-command.test.ts` | pass |
| QA-003 | input handling | core | 空 instanceId 报 `不能为空` input token，provider 不被调用 | `ecs-command.test.ts` | pass |
| QA-004 | not-found | core | provider not-found 不被改写，真实 `emitCliError` JSON record 分类为 `not_found` | `ecs-command.test.ts` | pass |
| QA-005 | JSON whitelist | core | result 仅含 `regionId/instanceId/detail.summary`，敏感字段负向断言 | `ecs-command.test.ts` | pass |
| QA-006 | text output | supporting | 非 JSON 模式打印基础详情，不 emit JSON result | `ecs-command.test.ts` | pass |
| QA-007 | metadata | core | help/catalog 暴露 safe、preferred JSON、result fields、`--region` guidance | surface/help tests | pass |
| QA-008 | scope | core | 不改 provider/auth/RAM/doctor/generated docs，不注册 lifecycle 命令 | scope gate + diff | pass |

## 3. Command Results

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-command.test.ts` -> exit 0, 1 file passed, 10 tests passed.
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 3 files passed, 17 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 1 file passed, 4 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml --yaml-only` -> exit 0.
- `python3 .codestable/tools/codestable-dod-runner.py ...` -> status passed.
- `python3 .codestable/tools/codestable-scope-gate.py ...` -> status passed.
- `python3 .codestable/tools/codestable-evidence-pack.py ...` -> status passed.
- `ocr review --audience agent ...` -> 0 comments.

## 4. Scenario Results

- [x] `licell ecs info i-xxx --output json` emits `regionId`、`instanceId`、`detail.summary`。
- [x] `--region cn-shanghai` is passed to provider as `{ regionId: 'cn-shanghai' }`。
- [x] 未传 `--region` 时 provider 第二参数为 `undefined`，不跨 region 自动搜索。
- [x] 空 instanceId 不调用 provider，错误 message 可被归为 input。
- [x] provider not-found error 使用干净 `i-missing` ID，JSON error record 为 `RESOURCE_NOT_FOUND` / `not_found`。
- [x] mock detail 中的 `rawAttribute/userData/vncUrl/consoleOutput/password/keyPairPrivateKey` 不会进入 JSON result 或 help result fields。
- [x] namespace 中仅出现 `ecs list` / `ecs info` / `auth repair`，不出现 lifecycle 半成品命令。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- 未做真实 Alibaba Cloud live smoke。真实 ECS detail 查询由 provider tests 和后续 contract tests 承接。
- Text 模式 provider error 仍按既有 `withSpinner` 行为输出失败文本；Agent-facing 分类契约以 JSON 模式为准。

## 6. Cleanliness

- Debug output: pass.
- Temporary TODO/FIXME/XXX: pass.
- Commented-out code: pass.
- Unused imports / type errors: pass via `bun run typecheck`.
- Out-of-scope files: pass; scope-gate passed and generated docs are untouched.

## 7. Verdict

- Status: passed
- Next: acceptance stage for `ecs-info-command`.
