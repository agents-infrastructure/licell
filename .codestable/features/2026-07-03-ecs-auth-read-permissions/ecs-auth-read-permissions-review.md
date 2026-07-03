---
doc_type: feature-review
feature: 2026-07-03-ecs-auth-read-permissions
status: passed
reviewer: subagent+ocr
reviewed: 2026-07-03
round: 1
---

# ecs-auth-read-permissions 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-dod-results.json`
- Implementation evidence: current working tree diff plus DoD runner evidence.
- Diff basis: `git diff --stat` shows 7 tracked files changed, 168 insertions and 16 deletions.
- Baseline dirty files: none outside this feature scope; generated evidence JSON/Markdown files are under the feature directory.

### Independent Review

- Detection: Paseo subagent available and used; OCR CLI available and `ocr llm test` passed.
- 环节 A 独立隔离 Task agent: paseo completed, agent `0456e057-b384-4d67-854e-3acd9c2cc75c`.
- 环节 B OCR CLI: completed twice. Initial run found one comment in `src/providers/ram.ts`; after fix, second run produced 0 comments.
- OCR severity mapping: High -> blocking/important, Medium -> nit/suggestion, Low -> discarded.
- Merge policy: external reviewer findings were locally verified before merge; valid items were fixed or recorded.
- Gate effect: reviewer lane completed with `subagent+ocr`, so review gate is eligible to pass.

## 2. Diff Summary

- 新增：none in source; feature evidence files generated under `.codestable/features/2026-07-03-ecs-auth-read-permissions/`.
- 修改：
  - `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`
  - `src/utils/auth-recovery.ts`
  - `src/providers/ram.ts`
  - `src/providers/doctor-cloud.ts`
  - `src/__tests__/auth-recovery.test.ts`
  - `src/__tests__/ram-bootstrap.test.ts`
  - `src/__tests__/doctor-cloud.test.ts`
- 删除：none.
- 未跟踪 / staged：feature evidence result files are untracked until commit; no staged files.
- 风险热点：permissions/auth boundary, doctor optional cloud probe, test guard strength.

## 3. Adversarial Pass

- 假设的生产 bug：ECS mutating permission accidentally enters default RAM policy while tests still pass.
- 主动攻击过的反例：
  - `resolveAuthCapabilityActions(['ecs'])` returns extra lifecycle action.
  - `LICELL_POLICY_ACTIONS` contains only one mutating ECS action and weak negative assertion misses it.
  - ECS becomes required in one doctor plan branch and blocks unrelated workflows.
  - ECS AccessDenied is classified as error instead of optional warn.
  - doctor duplicates ECS SDK client construction instead of using provider seam.
- 结果：subagent found the weak negative assertion; it was fixed with per-action `not.toContain`. Doctor optional coverage was broadened across current branches. No remaining blocking issue found.

## 4. Findings

### blocking

none

### important

none

### nit

none

### suggestion

- `src/providers/doctor-cloud.ts:1195` ECS probe uses `listEcsInstances({ limit: 1 })`, which follows existing provider patterns where some probes do not pass `auth.region` explicitly. This is acceptable for this feature and consistent with the approved design, but future doctor work could consider a stricter region-binding contract across all provider probes.

### learning

- For negative permission-boundary tests, `not.toEqual(expect.arrayContaining([...]))` only fails when every item is present. Use per-item `not.toContain` or an explicit intersection check for security guardrails.

### praise

- ECS capability, RAM policy, and doctor probe are wired through existing shared tables and provider seams without adding command surface or generated-doc drift.

## 5. Test And QA Focus

- QA 必须重点复核：
  - `resolveAuthCapabilityActions(['ecs'])` returns exactly `ecs:DescribeInstanceAttribute` and `ecs:DescribeInstances`.
  - `LICELL_POLICY_ACTIONS` contains both ECS Describe actions and no ECS lifecycle/create action.
  - ECS is optional across current doctor plan branches and AccessDenied maps to warn with `licell auth repair`.
  - No command registry/help/catalog/docs files changed.
- Evidence pack residual risks / gate warnings: none; gate and DoD results passed.
- 建议新增或加强的测试：already addressed during review by broadening doctor optional branches and strengthening RAM negative assertions.
- 不能靠 review 完全确认的点：real Alibaba Cloud ECS AccessDenied shape is not live-smoked here; classification relies on existing `isAccessDeniedError` behavior and mocked representative error.

## 6. Residual Risk

- ECS doctor probe is a new optional cloud call for all doctor runs. It is classified as warn on permission/region issues, but live provider/network variance should remain QA focus for future ECS command features.

## 7. Verdict

- Status: passed
- Next: enter `cs-feat` QA stage for `ecs-auth-read-permissions`.
