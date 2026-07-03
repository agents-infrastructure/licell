---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-command-surface-docs
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-command-surface-docs 验收报告

## 1. 接口契约核对

- [x] 不新增或修改 ECS provider 查询行为。
- [x] 不新增或修改 auth/RAM/doctor 权限行为。
- [x] 不注册 `ecs start/stop/reboot/delete/rm` 等 lifecycle 半成品命令。
- [x] README generated block 和 `docs/reference/agent-surfaces.md` 通过 `docs:sync` 更新，并通过 `docs:check` 对拍。
- [x] README 顶部 ECS 能力 bullet 位于非生成区，不复制命令表。
- [x] Skill/scaffold 继续要求 Agent 以 `catalog` / `--help --output json` / `--output json` 为事实源。

## 2. 合同覆盖核对

- [x] Command reference sections 包含 `infra`，且顺序为 data -> infra -> automation。
- [x] Agent command catalog root commands 包含 `ecs`，`ecs list/info` 均为 `sectionId=infra`。
- [x] `ecs list` help/catalog result fields 覆盖 `regionId/count/limit/totalCount/truncated/filters/instances[]`。
- [x] `ecs info` help/catalog result fields 覆盖 `regionId/instanceId/detail.summary`。
- [x] README generated block 与 agent surface 含 `licell ecs list` 和 `licell ecs info <instanceId>`。
- [x] `renderSkillCommandReference()` 含 ECS 查询命令，不含 lifecycle 半命令。
- [x] `resolveCompletionCandidates()` 在 root/ecs/ecs list 三层返回 ECS root、list/info 子命令和关键 options。
- [x] `.claude/skills/licell/SKILL.md` 与 `getSkillFiles('claude')[0].content` 全文一致。

## 3. Review / QA 核对

- [x] Independent review: Paseo subagent `e720d78a-fa58-4fa1-b9da-a2c7da82d2a2` completed.
- [x] OCR review: 0 comments.
- [x] Review M1 fixed: completion lifecycle guard 改为逐项 `not.toContain`。
- [x] Review L1 fixed: checklist checks marked `passed`。
- [x] QA report passed with no failed or blocked item.

## 4. Validation Evidence

- `bun run typecheck` -> exit 0.
- `bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/readme-docs.test.ts src/__tests__/agent-surface-docs.test.ts src/__tests__/skills-scaffold.test.ts` -> exit 0, 25 tests passed.
- `bun x vitest run src/__tests__/command-surface-metadata.test.ts src/__tests__/cli-help-json-contract.test.ts` -> exit 0, 11 tests passed.
- `bun x vitest run src/__tests__/shell-completion.test.ts` -> exit 0, 14 tests passed.
- `bun run docs:sync` -> exit 0.
- `bun run docs:check` -> exit 0.
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-checklist.yaml --yaml-only` -> exit 0.
- DoD runner `implementation.after_review` -> passed.
- Scope gate `implementation.after_review` -> passed.
- Evidence pack `implementation.after_review` -> passed.

## 5. Roadmap / Requirement Delta

- Roadmap item `ecs-command-surface-docs` is ready to mark done.
- Goal state feature `ecs-command-surface-docs` is ready to mark accepted.
- Goal state can advance to `ecs-lifecycle-command-scaffold`.

## 6. Residual Risk

- docs/help 层 lifecycle guard 仍有枚举式正则，但 registry-derived command reference 层已用 infra 精确集合断言兜底。
- No live cloud calls were run or required.

## 7. Verdict

- Status: passed
- Next: update roadmap/goal state and commit Feature 6.
