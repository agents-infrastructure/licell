---
doc_type: feature-qa
feature: 2026-07-03-ecs-lifecycle-command-scaffold
status: passed
tested: 2026-07-03
round: 1
---

# ecs-lifecycle-command-scaffold QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-evidence.json`
- DoD results: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-dod-before-review.json`
- Scope results: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-scope-before-review.json`

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据 | 结果 |
|---|---|---|---|---|---|
| QA-001 | scope | core | 不注册 ECS lifecycle command，不新增 provider mutating wrapper | scope gate + diff | pass |
| QA-002 | seed | core | seed 文档存在，且明确不是当前用户指南 | seed 文档复核 | pass |
| QA-003 | seed | core | phase split 覆盖 start/reboot、stop、rm/delete、run/create | seed 文档复核 | pass |
| QA-004 | seed | core | common preflight 覆盖 region、detail read、状态校验、dry-run、confirm、execute、verify | seed 文档复核 | pass |
| QA-005 | command surface | core | catalog/reference/help/completion 不暴露 start/stop/reboot/delete/rm/run/create | Vitest surface suites | pass |
| QA-006 | help JSON | core | `licell ecs --help --output json` subcommands 精确为 `ecs info` / `ecs list` | `cli-help-json-contract.test.ts` | pass |
| QA-007 | auth | core | `resolveAuthCapabilityActions(['ecs'])` 精确等于 Describe 白名单 | `auth-recovery.test.ts` | pass |
| QA-008 | RAM | core | bootstrap policy 和 `LICELL_POLICY_ACTIONS` 不含实例 lifecycle action 黑名单 | `ram-bootstrap.test.ts` | pass |
| QA-009 | review focus | supporting | 裸 key 正则覆盖与 seed RAM 文案已按 review 处理 | diff + rerun tests | pass |

## 3. Command Results

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts` -> exit 0, 3 files passed, 16 tests passed.
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts` -> first concurrent run hit a 10s timeout in the ECS namespace help test; rerun of the same command exited 0, 2 files passed, 19 tests passed.
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts` -> exit 0, 2 files passed, 10 tests passed.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml --yaml-only` -> exit 0.
- `git diff --check` -> exit 0.
- OCR review after nit fixes -> 0 comments.

## 4. Scenario Results

- [x] 当前 ECS surface 仍保持只读：`ecs list` / `ecs info`。
- [x] Seed 文档声明后续 lifecycle 必须另起 feature design，不把当前文档写成可执行用户指南。
- [x] Future command contract 覆盖 safety、confirm、dry-run、future RAM action、precheck、verify。
- [x] `stop` 被单独标注为 interruption / high-impact，不被当作普通可逆操作处理。
- [x] `rm/delete` 被标注为 destructive，要求 `--yes` 与双确认。
- [x] `run/create` 被拆到单独 feature，不混入当前 lifecycle scaffold。
- [x] Auth/RAM 当前只读边界未被扩大。
- [x] 未修改 generated docs、doctor、provider、production command module。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- CLI help JSON 测试在一次高并发验证中出现超时抖动；同一命令随后重跑通过。该风险是测试冷启动耗时，不是功能失败。
- RAM policy 侧 guard 是实例 lifecycle action 黑名单，不是所有 ECS action 白名单；这与既有 security group action 共存的事实一致。

## 6. Cleanliness

- Debug output: pass.
- Temporary TODO/FIXME/XXX: pass.
- Commented-out code: pass.
- Unused imports / type errors: pass via `bun run typecheck`.
- Out-of-scope files: pass; scope gate passed.

## 7. Verdict

- Status: passed
- Next: acceptance stage for `ecs-lifecycle-command-scaffold`.
