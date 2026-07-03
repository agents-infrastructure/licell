---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-lifecycle-command-scaffold
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-lifecycle-command-scaffold 验收报告

## 1. 接口契约核对

- [x] 不注册 `licell ecs start/stop/reboot/delete/rm/run/create`。
- [x] 不新增 ECS provider lifecycle API wrapper。
- [x] 不修改 doctor ECS probe。
- [x] 不修改 `AuthCapability.ecs` 的只读 action list。
- [x] 不把 `ecs:StartInstance`、`ecs:StopInstance`、`ecs:RebootInstance`、`ecs:DeleteInstance`、`ecs:RunInstances` 加入 bootstrap policy。
- [x] 不手改 generated docs。

## 2. Seed 合同核对

- [x] `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md` 已新增。
- [x] 文档明确当前 ECS surface 仍只有 `ecs list/info`，不是当前用户指南。
- [x] Phase split 覆盖 start/reboot、stop、rm/delete、run/create。
- [x] Common preflight 覆盖 region 解析、读取 detail、状态校验、plan、dry-run、confirmation、execute、verify。
- [x] Future command contract 覆盖 safety level、confirm requirement、dry-run、future RAM action、precheck、verify。
- [x] Confirmation caveats 覆盖 `ensureDestructiveActionConfirmed()` 删除文案不可复用于 stop/reboot。
- [x] Confirmation caveats 覆盖 `confirmFlags` 自动收集只包含 `--yes` / `--apply` / `--force`。
- [x] RAM action policy 明确当前不得加入实例生命周期 mutating action，并与既有安全组权限事实区分。

## 3. Review / QA 核对

- [x] Independent review: Paseo subagent `d5adc10b-b333-495e-9dbd-d708283ed7a0` completed, no blocking / important.
- [x] OCR review: initial scan 0 comments; after nit fixes scan 0 comments.
- [x] Review nit N1 fixed: lifecycle guard regex restored bare `ecs start` key coverage.
- [x] Review residual R1 fixed: seed wording narrowed to instance lifecycle mutating actions.
- [x] QA report passed with no failed or blocked item.

## 4. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 16 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts` -> exit 0 on rerun, 19 tests passed.
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts` -> exit 0, 10 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml --yaml-only` -> exit 0.
- `git diff --check` -> exit 0.
- DoD runner `implementation.before_review` -> passed.
- Scope gate `implementation.before_review` -> passed.
- Evidence pack `implementation.before_review` -> passed.

## 5. Roadmap / Requirement Delta

- Roadmap item `ecs-lifecycle-command-scaffold` is ready to mark done.
- Goal state feature `ecs-lifecycle-command-scaffold` is ready to mark accepted.
- This is the final planned feature; after scoped commit the goal should enter final roadmap audit.

## 6. Residual Risk

- No live ECS call was run or required; this feature intentionally contains no runtime lifecycle behavior.
- RAM policy guard remains scoped to known instance lifecycle actions because current policy intentionally includes existing security group actions.

## 7. Verdict

- Status: passed
- Next: update checklist checks, roadmap item, goal state, then commit Feature 7.
