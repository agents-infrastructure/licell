---
doc_type: feature-qa
feature: 2026-07-03-ecs-auth-read-permissions
status: passed
tested: 2026-07-03
round: 1
---

# ecs-auth-read-permissions QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-dod-results.json`
- Feature type: auth / permissions / doctor diagnostics.
- Core evidence gate: unit tests, integration smoke, typecheck, YAML validation, scope/diff checks.

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据 | 结果 |
|---|---|---|---|---|---|
| QA-001 | design capability contract | core | `AuthCapability='ecs'`、label 非空、action hints 仅两个 Describe action | `auth-recovery.test.ts` | pass |
| QA-002 | design RAM policy | core | 默认 policy 包含两个 ECS Describe action，保留 security group action | `ram-bootstrap.test.ts` | pass |
| QA-003 | review finding 1 | core | 任一 ECS mutating action 被误加入时测试会失败 | per-action `not.toContain` | pass |
| QA-004 | doctor optional plan | core | ECS 在当前 doctor plan 分支均为 optional | `doctor-cloud.test.ts` table cases | pass |
| QA-005 | doctor probe seam | core | ECS probe 通过 `listEcsInstances({ limit: 1 })`，不复制 ECS SDK client | mocked provider assertion | pass |
| QA-006 | migration / warn behavior | core | optional ECS AccessDenied -> warn，nextActions 包含 `licell auth repair` | `runCapabilityProbe` + summary test | pass |
| QA-007 | scope | core | 不注册 command，不改 registry/help/catalog/docs，不新增 provider query logic | diff/scope-gate | pass |
| QA-008 | cleanliness | supporting | typecheck、YAML、diff check、OCR clean | commands + review report | pass |

## 3. Command Results

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts src/__tests__/doctor-cloud.test.ts src/__tests__/doctor-cloud-integration.test.ts` -> exit 0, 4 files passed, 22 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml --yaml-only` -> exit 0.
- `python3 .codestable/tools/codestable-dod-runner.py ...` -> exit 0, DoD status passed.
- `python3 .codestable/tools/codestable-scope-gate.py ...` -> exit 0, scope-gate status passed.
- `ocr review --audience agent ...` after review fixes -> exit 0, 0 comments.

## 4. Scenario Results

- [x] Capability contract: `AUTH_CAPABILITY_LABELS.ecs` is `ECS`; `resolveAuthCapabilityActions(['ecs'])` returns exactly `ecs:DescribeInstanceAttribute` and `ecs:DescribeInstances`.
- [x] RAM policy: `LICELL_POLICY_ACTIONS` includes both ECS Describe actions and existing `ecs:DescribeSecurityGroups` / `ecs:CreateSecurityGroup`.
- [x] Mutating action guard: test now checks each denied ECS lifecycle/create action independently.
- [x] Doctor plan: ECS remains optional for docker API with network, static, task, and no-project cases.
- [x] Doctor probe: `runCapabilityProbe(auth, 'ecs', false)` calls `listEcsInstances({ limit: 1 })` and returns ok on success.
- [x] Optional AccessDenied: probe status is warn, summary is `ECS 读权限不足。`, and capability summary nextActions includes `licell auth repair`.
- [x] Scope guard: no command/docs/generated surface changes; production diff contains no ECS lifecycle API or mutating action.

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- Live ECS cloud error shapes were not smoke-tested with real credentials in this feature. Existing error classification is covered by representative mocked AccessDenied and shared cloud-error helpers.
- Some existing doctor probes rely on provider/global auth context rather than passing `auth.region` explicitly; ECS follows that existing pattern and remains optional. This is not blocking for the approved feature.

## 6. Cleanliness

- Debug output: pass. Existing `console.log` in auth prompt flow is pre-existing user-facing output, not new debug output.
- Temporary TODO/FIXME/XXX: pass.
- Commented-out code: pass.
- Unused imports / type errors: pass via `bun run typecheck`.
- Out-of-scope files: pass; scope-gate passed and command/docs surfaces are unchanged.

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance stage for `ecs-auth-read-permissions`.
