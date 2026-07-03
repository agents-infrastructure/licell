---
doc_type: feature-qa
feature: 2026-07-03-ecs-filter-contract-tests
status: passed
tested: 2026-07-03
round: 1
---

# ecs-filter-contract-tests QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-dod-results.json`

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据 | 结果 |
|---|---|---|---|---|---|
| QA-001 | scope | core | 纯测试补强，不改 production command/provider/auth/docs | scope gate + diff | pass |
| QA-002 | provider filters | core | request shape 覆盖 region、instanceIds、name/namePrefix、status、tag、IP、network、type、charge | `ecs-provider.test.ts` | pass |
| QA-003 | no post-filter | core | SDK 返回不匹配 filter 的 row 时 provider 原样返回 | `ecs-provider.test.ts` | pass |
| QA-004 | command parser | core | CLI options 到 provider options，repeatable tag、CSV、status/name 原样透传 | `ecs-command.test.ts` | pass |
| QA-005 | error category | core | list input errors -> input；info not-found -> not_found；missing args e2e -> input | command + integration tests | pass |
| QA-006 | payload contract | core | list/info JSON payload 字段稳定 | `ecs-command.test.ts` | pass |
| QA-007 | sensitive whitelist | core | rawAttribute/userData/vncUrl/consoleOutput/password/keyPairPrivateKey 不进入 result | provider + command tests | pass |
| QA-008 | validation | supporting | typecheck、YAML、DoD、scope、OCR | command outputs | pass |

## 3. Command Results

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-provider.test.ts src/__tests__/ecs-command.test.ts` -> exit 0, 2 files passed, 22 tests passed.
- `bun x vitest run src/__tests__/cli-error.integration.test.ts src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 2 files passed, 7 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml --yaml-only` -> exit 0.
- `python3 .codestable/tools/codestable-dod-runner.py ...` -> status passed.
- `python3 .codestable/tools/codestable-scope-gate.py ...` -> status passed.
- `python3 .codestable/tools/codestable-evidence-pack.py ...` -> status passed.
- `ocr review --audience agent ...` -> 0 comments.

## 4. Scenario Results

- [x] Provider request shape covers all roadmap filter fields and namePrefix maps to `instanceName=prefix*`.
- [x] Provider preserves status casing and exact instance name.
- [x] Provider does not post-filter returned SDK rows.
- [x] Command parser preserves status casing, exact name, repeatable tags, CSV instance IDs and IP split fields.
- [x] Invalid tag and mutually exclusive name filters produce input JSON error records through output seam.
- [x] `ecs info` not-found uses provider-real message shape and produces `not_found` / `RESOURCE_NOT_FOUND`.
- [x] `ecs info` missing instance arg e2e produces structured input error.
- [x] Sensitive fields are absent from provider summaries and command JSON results.

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- No live cloud calls were run or required.
- Some command error tests use output seam rather than full CLI process. This is acceptable per design and avoids real auth/provider setup.

## 6. Cleanliness

- Debug output: pass.
- Temporary TODO/FIXME/XXX: pass.
- Commented-out code: pass.
- Unused imports / type errors: pass via `bun run typecheck`.
- Out-of-scope files: pass; scope-gate passed.

## 7. Verdict

- Status: passed
- Next: acceptance stage for `ecs-filter-contract-tests`.
