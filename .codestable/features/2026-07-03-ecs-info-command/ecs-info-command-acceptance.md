---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-info-command
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-info-command 验收报告

## 1. 接口契约核对

- [x] 新增 `licell ecs info <instanceId>`，复用既有 ECS command module。
- [x] 命令使用 `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })`。
- [x] 命令调用 `getEcsInstanceDetail(instanceId, { regionId })`；未传 region 时不跨 region 自动搜索。
- [x] JSON payload 为 `regionId`、`instanceId`、`detail.summary`。
- [x] `detail.summary` 只包含 roadmap 白名单基础字段。
- [x] not-found 错误不被命令层改写，JSON error category 为 `not_found`。

## 2. 行为与决策核对

- [x] 未修改 ECS provider 查询实现。
- [x] 未修改 auth/RAM/doctor capability。
- [x] 未改变 `ecs list` parser、filters、文本输出或 JSON payload。
- [x] 未注册 start/stop/reboot/delete/rm/runInstances 等 lifecycle 命令。
- [x] 未手改 README generated block 或 `docs/reference/agent-surfaces.md`。
- [x] namespace metadata 已更新为 list → info → auth repair，不包含 lifecycle 半成品命令。

## 3. 验收场景核对

- [x] S1 command registration：manifest diagnostics empty，ECS module commands 为 `ecs list` 和 `ecs info <instanceId>`。
- [x] S2 execution path：mock provider 断言 `getEcsInstanceDetail('i-demo', { regionId: 'cn-shanghai' })`。
- [x] S3 JSON/text output：JSON 白名单 result 和文本详情输出均有测试覆盖。
- [x] S4 sensitive field guard：mock detail 中敏感字段不进入 command result；help result fields 不含敏感字段。
- [x] S5 not-found：真实 `emitCliError` JSON record 分类为 `not_found` / `RESOURCE_NOT_FOUND`。
- [x] S6 input error：空 instanceId message 含 `不能为空`，provider 未调用。
- [x] S7 scope：scope gate passed，diff 不含 provider/auth/RAM/doctor/generated docs 漂移。

## 4. Review / QA 核对

- [x] Independent review: Paseo subagent `18e6678e-d6f3-41ca-beda-190d95c81838` completed.
- [x] OCR review: 0 comments.
- [x] Review I-1 fixed: not-found 测试补强到真实 `emitCliError` JSON record。
- [x] Review N-1 fixed: namespace summary 不再把详情命令描述为后续能力。
- [x] QA report passed with no failed or blocked item.

## 5. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-command.test.ts` -> exit 0, 10 tests passed.
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 17 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 4 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml --yaml-only` -> exit 0.
- `codestable-dod-runner.py` implementation stage -> passed.
- `codestable-scope-gate.py` implementation stage -> passed.
- `codestable-evidence-pack.py` implementation stage -> passed.

## 6. Roadmap / Requirement Delta

- Roadmap item `ecs-info-command` is ready to mark done.
- Goal state feature `ecs-info-command` is ready to mark accepted and advance to `ecs-filter-contract-tests`。
- Generated docs sync remains scheduled for `ecs-command-surface-docs`。

## 7. Residual Risk

- No live Alibaba Cloud ECS smoke was run. This is acceptable because command behavior is covered by provider mocks and provider-level tests.
- Future provider detail expansion must continue to go through command-level whitelist builder.

## 8. Verdict

- Status: passed
- Next: update roadmap/goal state and commit Feature 4.
