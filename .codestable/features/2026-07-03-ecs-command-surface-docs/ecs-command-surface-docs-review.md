---
doc_type: feature-review
feature: 2026-07-03-ecs-command-surface-docs
reviewer: subagent+ocr
status: passed
created: 2026-07-03
---

# ecs-command-surface-docs implementation review

## 结论

独立 review 已完成。Paseo reviewer 发现 1 个 Medium 测试弱断言；OCR review 返回 0 comments。Medium 已修复并重跑验证，当前无阻塞问题。

## Review 来源

- Paseo reviewer：`e720d78a-fa58-4fa1-b9da-a2c7da82d2a2`
- OCR：`ocr review --audience agent ...`，0 comments

## Findings 与处置

### M1：completion lifecycle 反向断言过弱

位置：`src/__tests__/shell-completion.test.ts`

问题：原断言使用 `not.toEqual(expect.arrayContaining(['start', 'stop', 'reboot', 'delete', 'rm']))`，只能在五个 lifecycle 候选同时泄漏时失败，无法拦截单个 `ecs start` 泄漏。

处置：已改为逐项 `not.toContain`，确保任意 lifecycle 候选出现都会失败。

### L1：checklist checks 仍为 pending

处置：已在 review 后将 `checks[]` 回填为 `passed`，并重跑 YAML 校验与 DoD runner。

### L2：docs/help/completion lifecycle 守卫依赖枚举正则

处置：保留为残余低风险。catalog/command reference 层已有 `infra.commands` 精确集合断言，completion 也已逐项禁止当前 lifecycle 候选。

### L3 / L4：信息项

处置：无需改动。README 手写 bullet 被测试锁定是可接受的能力说明守卫。

## 验证

- `bun run typecheck`：passed
- `bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/readme-docs.test.ts src/__tests__/agent-surface-docs.test.ts src/__tests__/skills-scaffold.test.ts`：passed
- `bun x vitest run src/__tests__/command-surface-metadata.test.ts src/__tests__/cli-help-json-contract.test.ts`：passed
- `bun x vitest run src/__tests__/shell-completion.test.ts`：passed
- `bun run docs:sync`：passed / already up to date
- `bun run docs:check`：passed
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-checklist.yaml --yaml-only`：passed
- DoD runner `implementation.after_review`：passed
- Scope gate `implementation.after_review`：passed
- Evidence pack `implementation.after_review`：passed
