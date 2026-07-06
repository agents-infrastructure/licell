# goal-feature: ecs-lifecycle-surface-harden

- Roadmap item: `ecs-lifecycle-surface-harden`
- Feature 性质: non-functional（surface 同步 + 回归收口）
- 依赖: ecs-lifecycle-stop, ecs-lifecycle-delete（命令集完整后才收口）

## 产物路径
- design: `.codestable/features/2026-07-03-ecs-lifecycle-surface-harden/ecs-lifecycle-surface-harden-design.md`
- checklist: `.codestable/features/2026-07-03-ecs-lifecycle-surface-harden/ecs-lifecycle-surface-harden-checklist.yaml`
- design-review: `.../ecs-lifecycle-surface-harden-design-review.md`（passed）
- review/qa/acceptance: `.../ecs-lifecycle-surface-harden-{review,qa,acceptance}.md`（goal 执行时生成）

## 核心运行路径
non-functional feature，无新用户运行路径。**替代证据**：
- `bun run docs:check` in sync（README/agent-surfaces/scenarios，4 targets）
- skills-scaffold / shell-completion / cli-help-json-contract 测试断言最终命令集
- 前置 gate：ecs start/reboot/stop/rm/delete 已在 registry；stop/delete 已 acceptance passed

## 必跑命令
- `bun run typecheck`
- `bun run docs:check`
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts src/__tests__/agent-surface-docs.test.ts src/__tests__/readme-docs.test.ts src/__tests__/skills-scaffold.test.ts`
- `bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts`

## Feature DoD / stage gates
- implementation.before_review: scope-gate / dod-runner / evidence-pack；steps 全 done；diff 只含 docs/tests/seed 无源码逻辑改动
- review.before_pass: 独立 reviewer；无 unresolved blocking；核验"不改 provider/harness 逻辑"
- qa.before_acceptance: 替代证据理由写明（non-functional）；docs:check + 一致性回归实际运行
- acceptance.before_done: checks 全 passed；roadmap item 回写；seed 状态更新

## Gate 输入产物
design、checklist、evidence pack、gate results、git diff

## 失败恢复路径
- 前置 gate 未满足（命令集不全 / stop/delete 未 accepted）→ blocked，不跑 docs sync
- generator 未覆盖某命令 → 记观察项；若需改 generator target 属超范围 → handoff
- review blocking → review-fix 重跑；QA failed → qa-fix 重跑

## 验收证据
docs:check 输出、skills-scaffold/shell-completion/cli-help-json-contract 测试、跨命令一致性测试（dry-run 无副作用、确认矩阵、verify 字段级、safety metadata）、diff review 证明只含 docs/tests/seed

## 交付物
generated docs 刷新（README/agent-surfaces）、skill scaffold 更新、completion 覆盖、跨命令一致性测试、`ecs-lifecycle-command-seeds.md` 状态更新

## 清洁度规则
禁调试输出 / TODO/FIXME / 注释代码 / 死 import；diff 限于 docs+tests+seed，不含源码逻辑改动

## 失败恢复边界
不手改 generated docs（只跑 docs:sync）；不改 provider/harness 行为；docs pipeline 只 4 targets，skill/completion 各自测试证明，不用 docs:check 冒充
