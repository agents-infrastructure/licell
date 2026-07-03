---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-filter-contract-tests
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-filter-contract-tests 验收报告

## 1. 接口契约核对

- [x] 本 feature 不新增或修改 `licell ecs` 用户命令。
- [x] 不新增 provider filter，不改变已有 filter 语义。
- [x] 不修改 auth/RAM/doctor capability。
- [x] 不手改 README generated block 或 `docs/reference/agent-surfaces.md`。
- [x] 不打真实阿里云，不依赖真实 AK/SK 或用户 home auth。

## 2. 合同覆盖核对

- [x] Provider request shape 覆盖 tag/privateIp/publicIp/eip/name/namePrefix/status/region/vpc/vsw/zone/type/charge/instanceIds。
- [x] `--status` 原样透传，不做别名或大小写归一。
- [x] `--name-prefix` 在 command 层保持 `namePrefix`，provider 层映射为 `instanceName=prefix*`。
- [x] Provider 不做分页后本地 filtering；mock 不匹配 filter 的实例时原样返回。
- [x] 非法 tag、name/namePrefix 互斥、缺失 instanceId 的 JSON error category 为 input。
- [x] `ecs info` not-found JSON error category 为 not_found，且不触发跨 region fallback。
- [x] `ecs list` JSON payload 包含 `regionId/count/limit/totalCount/truncated/filters/instances[]`。
- [x] `ecs info` JSON payload 包含 `regionId/instanceId/detail.summary`。
- [x] mock SDK / provider response 注入敏感字段时，provider summary 和 command result 不包含敏感字段。

## 3. Review / QA 核对

- [x] Independent review: Paseo subagent `9cc11146-c2c0-4dc8-9db9-d9ed6c71dd24` completed.
- [x] OCR review: 0 comments.
- [x] Review I1 fixed: not-found stage 断言改为生产一致的 `runtime`。
- [x] Review I2 fixed: not-found mock message 改为 provider 真实格式。
- [x] Review N1 fixed: checklist checks marked passed.
- [x] QA report passed with no failed or blocked item.

## 4. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/ecs-provider.test.ts src/__tests__/ecs-command.test.ts` -> exit 0, 22 tests passed.
- `bun x vitest run src/__tests__/cli-error.integration.test.ts src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 7 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml --yaml-only` -> exit 0.
- `codestable-dod-runner.py` implementation stage -> passed.
- `codestable-scope-gate.py` implementation stage -> passed.
- `codestable-evidence-pack.py` implementation stage -> passed.

## 5. Roadmap / Requirement Delta

- Roadmap item `ecs-filter-contract-tests` is ready to mark done.
- Goal state feature `ecs-filter-contract-tests` is ready to mark accepted and advance to `ecs-command-surface-docs`。
- No generated docs sync is part of this test-only feature.

## 6. Residual Risk

- Provider request tests focus on required filter fields and do not enforce a closed request key set.
- Command error tests use output seam for some runtime input errors; full CLI e2e is limited to missing-args path.

## 7. Verdict

- Status: passed
- Next: update roadmap/goal state and commit Feature 5.
