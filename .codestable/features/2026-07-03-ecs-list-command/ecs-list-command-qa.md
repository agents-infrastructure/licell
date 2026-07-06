---
doc_type: feature-qa
feature: 2026-07-03-ecs-list-command
status: passed
tested: 2026-07-03
round: 1
---

# ecs-list-command QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-dod-results.json`

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据 | 结果 |
|---|---|---|---|---|---|
| QA-001 | command skeleton | core | `ecsCommandModule` 注册在 INFRA section，且只注册 `ecs list` | registry / manifest tests | pass |
| QA-002 | parser contract | core | region、limit、status、namePrefix、instanceIds、network、tag、IP filters 映射到 provider options | `ecs-command.test.ts` | pass |
| QA-003 | review I1 | core | `--tag env=` 不再降级为 key-only 查询，而是 input error | `ecs-command.test.ts` | pass |
| QA-004 | execution path | core | `executeWithAuthRecovery` 使用 `requiredCapabilities=['ecs']`，并调用 provider | `ecs-command.test.ts` | pass |
| QA-005 | output contract | core | JSON result 直接 emit provider result，文本输出含设计列和空态 | `ecs-command.test.ts` | pass |
| QA-006 | agent surface | core | help/catalog metadata 暴露 preferred JSON、safe、result fields、optionInsights | surface/help tests | pass |
| QA-007 | scope | core | 不修改 provider/auth/RAM/doctor，不手改 generated docs，不注册 lifecycle/info 命令 | scope gate + diff | pass |
| QA-008 | cleanliness | supporting | typecheck、YAML、DoD、evidence pack | commands + generated gate results | pass |

## 3. Command Results

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-command.test.ts` -> exit 0, 1 file passed, 6 tests passed.
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 3 files passed, 16 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 1 file passed, 3 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml --yaml-only` -> exit 0.
- `python3 .codestable/tools/codestable-dod-runner.py ...` -> status passed.
- `python3 .codestable/tools/codestable-scope-gate.py ...` -> status passed.
- `python3 .codestable/tools/codestable-evidence-pack.py ...` -> status passed.

## 4. Scenario Results

- [x] `licell ecs list --output json` path emits provider result and does not write project state.
- [x] `--limit 500` is capped to `200`; default remains `20`.
- [x] `--status Running` is passed through without case or alias normalization.
- [x] `--name` and `--name-prefix` are mutually exclusive.
- [x] repeatable `--tag key=value` becomes `tags[]`; `--tag env=` and missing separator are input errors.
- [x] `--private-ip` / `--public-ip` / `--eip` map to distinct provider fields.
- [x] non-JSON output prints compact list columns and empty state.
- [x] help JSON exposes `instances[]` and `filters` result fields.

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- Real ECS cloud filtering is not live-smoked here; provider tests and future filter contract tests remain the stronger place to validate SDK parameter semantics.
- Generated README / agent surface docs are intentionally not synced in this feature and remain scheduled for `ecs-command-surface-docs`.

## 6. Cleanliness

- Debug output: pass.
- Temporary TODO/FIXME/XXX: pass.
- Commented-out code: pass.
- Unused imports / type errors: pass via `bun run typecheck`.
- Out-of-scope files: pass; scope-gate passed and generated docs are untouched.

## 7. Verdict

- Status: passed
- Next: acceptance stage for `ecs-list-command`.
