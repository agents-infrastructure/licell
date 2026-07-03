---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-list-command
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-list-command 验收报告

## 1. 接口契约核对

- [x] 新增 `licell ecs list`，并通过 command registry / catalog / help JSON 可发现。
- [x] `ecs list` 使用 `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })`。
- [x] JSON payload 保持 provider `EcsListInstancesResult` 结构：`regionId/count/limit/totalCount/truncated/filters/instances[]`。
- [x] command descriptor 暴露 `preferredOutput=json`、`safety.level=safe`、examples、optionInsights 和 result fields。
- [x] `INFRA_SECTION` 新增并承载 ECS module，manifest 顺序为 Data Services 后、Automation & Tooling 前。

## 2. 行为与决策核对

- [x] 本 feature 只注册 `ecs list`，没有注册 `ecs info` 或 lifecycle / mutating 命令。
- [x] 命令层只做输入归一和格式校验，不做本地 post-filter。
- [x] `--region` 只影响本次 provider query，不修改默认 auth region。
- [x] `--limit` 默认 20、最大 200，不作为全量导出命令。
- [x] `--status` 原样透传 ECS 原生值。
- [x] `--name` 与 `--name-prefix` 互斥，错误 message 含 input 分类 token。
- [x] `--tag key=value` 要求 key/value 均非空；重复 tag 作为 AND 条件传给 provider。
- [x] 未修改 provider/auth/RAM/doctor，未手改 generated README 或 docs reference。

## 3. 验收场景核对

- [x] S1 command skeleton：`command-manifest.test.ts` 验证 ECS module 位置和 INFRA section。
- [x] S2 parser contract：`ecs-command.test.ts` 验证完整 filter mapping。
- [x] S3 execution path：`ecs-command.test.ts` 验证 auth recovery、provider 调用、JSON result 和文本输出。
- [x] S4 agent surface metadata：`command-surface-metadata.test.ts` 和 `cli-help-json-contract.test.ts` 验证 help/catalog surface。
- [x] S5 scope：scope gate passed，diff 只包含 feature 允许文件。
- [x] S6 review fixes：`--tag env=` 负路径、文本列、checklist status 均已收敛。

## 4. Review / QA 核对

- [x] Independent review: Paseo subagent `de549f6a-24e9-46c1-8ef3-a1cda1155c16` completed.
- [x] Review important finding fixed: empty tag value now reports input error and is covered by tests.
- [x] Review nits addressed: text columns completed, redundant tag return simplified, command parse negative path covered, checklist checks marked passed.
- [x] OCR review completed with 0 comments before report; fresh tests and gates passed after review fixes.
- [x] QA report passed with no failed or blocked item.

## 5. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-command.test.ts` -> exit 0, 6 tests passed.
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 16 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 3 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml --yaml-only` -> exit 0.
- `codestable-dod-runner.py` implementation stage -> passed.
- `codestable-scope-gate.py` implementation stage -> passed.
- `codestable-evidence-pack.py` implementation stage -> passed.

## 6. Roadmap / Requirement Delta

- Roadmap item `ecs-list-command` is ready to mark done.
- Goal state feature `ecs-list-command` is ready to mark accepted and advance to `ecs-info-command`.
- Generated docs sync is intentionally deferred to `ecs-command-surface-docs`.

## 7. Residual Risk

- No live Alibaba Cloud ECS smoke was run. This is acceptable for this command feature because provider behavior is behind mocked command tests and later filter contract tests.
- `ecs info` remains absent by design and will be implemented by the next roadmap item.

## 8. Verdict

- Status: passed
- Next: update roadmap/goal state and commit Feature 3.
