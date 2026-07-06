---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-auth-read-permissions
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-auth-read-permissions 验收报告

## 1. 接口契约核对

- [x] `AuthCapability` 新增 `ecs`，后续命令可以通过 `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })` 声明 ECS 查询权限需求。
- [x] `AUTH_CAPABILITY_LABELS.ecs` 是稳定非空标签 `ECS`。
- [x] `resolveAuthCapabilityActions(['ecs'])` 返回且仅返回 `ecs:DescribeInstanceAttribute`、`ecs:DescribeInstances`。
- [x] `LICELL_POLICY_ACTIONS` 包含 `ecs:DescribeInstanceAttribute`、`ecs:DescribeInstances`，并保留 `ecs:DescribeSecurityGroups`、`ecs:CreateSecurityGroup`。
- [x] `runCapabilityProbe(auth, 'ecs', false)` 可作为 doctor test seam 直接观察 ECS optional probe。

## 2. 行为与决策核对

- [x] ECS capability 只表示实例只读查询；未加入 `StartInstance` / `StopInstance` / `RebootInstance` / `DeleteInstance` / `RunInstances`。
- [x] bootstrap / repair 的默认 RAM policy 会获得 ECS Describe 权限；存量 operator 迁移路径仍是管理员重新执行 `licell auth repair`。
- [x] doctor 中 ECS 是 optional probe，不会成为 deploy / static / task 工作流 required capability。
- [x] doctor ECS probe 复用 `listEcsInstances({ limit: 1 })` provider seam，没有复制 ECS SDK client 构造。
- [x] optional ECS AccessDenied 被归类为 warn，并通过 capability summary 暴露 `licell auth repair` next action。
- [x] 未注册 `licell ecs` 命令，未修改 command registry / help / catalog / README / docs / skills。

## 3. 验收场景核对

- [x] S1 capability label/action hints：`auth-recovery.test.ts` 覆盖。
- [x] S2 RAM policy includes read action：`ram-bootstrap.test.ts` 覆盖。
- [x] S3 mutating action deny-list：review 后改为逐项 `not.toContain`，可拦截单个 action 泄漏。
- [x] S4 doctor optional plan：`doctor-cloud.test.ts` 覆盖 docker API、static、task、no-project 当前分支。
- [x] S5 provider seam：mock `../providers/ecs` 后断言 `listEcsInstances({ limit: 1 })`。
- [x] S6 AccessDenied migration warn：mock AccessDenied 后断言 warn 和 `licell auth repair` nextAction。
- [x] S7 no side effects / scope：scope gate passed；生产 diff 不写 `.licell/project.json`、`.licell/state.json` 或 component 配置。

## 4. Review / QA 核对

- [x] Independent review: Paseo subagent `0456e057-b384-4d67-854e-3acd9c2cc75c` completed.
- [x] Review finding 1 fixed: RAM mutating-action negative guard now checks each denied action independently.
- [x] Review observation 2 addressed: ECS optional test now covers multiple current plan branches.
- [x] OCR initial nit fixed: RAM ECS section comment changed to `security group + instance read`.
- [x] OCR rerun after fixes: 0 comments.
- [x] QA report passed with no failed or blocked item.

## 5. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts src/__tests__/doctor-cloud.test.ts` -> exit 0, 20 tests passed.
- `bun x vitest run src/__tests__/doctor-cloud-integration.test.ts` -> exit 0, 2 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml --yaml-only` -> exit 0.
- `codestable-dod-runner.py` acceptance stage -> passed.
- `codestable-scope-gate.py` acceptance stage -> passed.
- `codestable-evidence-pack.py` acceptance stage -> passed.

## 6. Roadmap / Requirement Delta

- User-visible CLI command surface did not change, so generated README/docs sync is not required for this feature.
- Roadmap item `ecs-auth-read-permissions` is ready to mark done.
- Goal state feature `ecs-auth-read-permissions` is ready to mark accepted and advance to `ecs-list-command`.
- No requirement file delta required.

## 7. Residual Risk

- No live Alibaba Cloud smoke was run for ECS AccessDenied shape. This is acceptable for this feature because the contract is covered by shared error classification and representative tests.
- ECS optional doctor probe follows the existing provider/global auth pattern. Future doctor hardening can evaluate passing auth/region explicitly across all provider probes.

## 8. Verdict

- Status: passed
- Next: update roadmap/goal state and commit Feature 2.
