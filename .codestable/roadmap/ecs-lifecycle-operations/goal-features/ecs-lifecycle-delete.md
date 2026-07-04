# goal-feature: ecs-lifecycle-delete

- Roadmap item: `ecs-lifecycle-delete`
- Feature 性质: functional
- 依赖: ecs-lifecycle-start-reboot（复用 harness、mutating provider seam）

## 产物路径
- design: `.codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-design.md`
- checklist: `.codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-checklist.yaml`
- design-review: `.../ecs-lifecycle-delete-design-review.md`（passed）
- review/qa/acceptance: `.../ecs-lifecycle-delete-{review,qa,acceptance}.md`（goal 执行时生成）

## 核心运行路径（functional 必填）
- `ecs rm i-x --dry-run --output json` → willExecute=false，DeleteInstance 未被调用，plan.releaseFacts 有值
- `ecs rm i-x --yes`（无保护）→ 跳过交互确认调 DeleteInstance，verify notFound=true
- `ecs rm i-x` 非交互无 --yes → 抛错，不调 DeleteInstance
- releaseFacts 不可读 或 deletionProtection=true → 阻断，不调 DeleteInstance

## 必跑命令
- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts`
- `bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts`
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts`

## Feature DoD / stage gates
- implementation.before_review: scope-gate / dod-runner / evidence-pack；steps 全 done；清洁度
- review.before_pass: 独立 reviewer；无 unresolved blocking；重点审"事实不可读即阻断"是否落实
- qa.before_acceptance: 核心运行路径实际证据；覆盖 D1-D10（含 D4/D5 阻断、D2b TTY 双确认）
- acceptance.before_done: checks 全 passed；roadmap item 回写；提示存量 operator 获 delete 权限

## Gate 输入产物
design、checklist、evidence pack、gate results、git diff

## 失败恢复路径
- review blocking → review-fix 重跑；QA failed → qa-fix 重跑 review+QA
- 需改 harness 契约 → handoff

## 验收证据
provider 单测（getEcsInstanceReleaseFacts 读取、DeleteInstance shape、不可读错误）、harness delete 分支单测（releaseFacts 阻断、deletionProtection 阻断、verify not-found 终态）、命令测试（--yes 跳过/TTY 双确认/非交互阻断、rm=delete 一致）、guard（暴露 delete/rm 不暴露 run/create）、RAM（DeleteInstance 不含 RunInstances）

## 交付物
`src/providers/ecs/lifecycle.ts`(+release-facts/delete；可选拆 release-facts.ts)、`src/commands/ecs-lifecycle.ts`(+delete/rm)、`auth-recovery.ts`/`ram.ts`(+DeleteInstance/DescribeDisks)、tests

## 清洁度规则
禁调试输出 / TODO/FIXME / 注释代码 / 死 import

## 失败恢复边界
SDK DeleteInstance/DeletionProtection/DescribeDisks/DeleteWithInstance 字段名用 SDK types 核实；信息不足时**阻断删除**而非猜测放行；不新增同名 shim
