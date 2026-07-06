# goal-feature: ecs-lifecycle-start-reboot

- Roadmap item: `ecs-lifecycle-start-reboot`
- Feature 性质: functional
- 依赖: none（最小闭环）

## 产物路径
- design: `.codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-design.md`
- checklist: `.codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-checklist.yaml`
- design-review: `.codestable/features/2026-07-03-ecs-lifecycle-start-reboot/ecs-lifecycle-start-reboot-design-review.md`（passed）
- review: `.../ecs-lifecycle-start-reboot-review.md`（goal 执行时生成）
- qa: `.../ecs-lifecycle-start-reboot-qa.md`
- acceptance: `.../ecs-lifecycle-start-reboot-acceptance.md`

## 核心运行路径（functional 必填）
- `ecs start i-x --dry-run --output json`（Stopped）→ `willExecute=false`，mutating provider 未被调用
- `ecs start i-x`（Stopped）→ 调 StartInstance，bounded verify
- `ecs reboot i-x --dry-run`（Running，无 --yes）→ `requiresConfirmation=true, willExecute=false`，不确认不 mutating
- `ecs reboot i-x --yes`（Running）→ 确认通过调 RebootInstance

## 必跑命令
- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts`
- `bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts`
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts`

## Feature DoD / stage gates
- implementation.before_review: scope-gate / dod-runner / evidence-pack；checklist steps 全 done；diff 无范围外文件；清洁度通过
- review.before_pass: 独立 reviewer；无 unresolved blocking；解释 gate/provider warnings
- qa.before_acceptance: 核心运行路径实际运行证据；覆盖 design 关键场景 A1-A12
- acceptance.before_done: checklist checks 全 passed；roadmap item 回写；提示存量 operator 重新 auth repair 获 start/reboot 权限

## Gate 输入产物
design、checklist、evidence pack、gate results、git diff

## 失败恢复路径
- review blocking → review-fix 后重跑 cs-code-review
- QA failed → qa-fix 后重跑 review + QA
- 需改 harness 对外契约（stop/delete 复用）→ handoff（改 approved design 需用户确认）

## 验收证据
mock ECS client 单测（provider request shape、requestId）、harness 单测（dry-run 不调 mutating、per-action precheck、bounded verify timedOut）、命令测试（确认策略、JSON result fields）、guard 测试（暴露 start/reboot 不暴露 stop/delete）、RAM 测试

## 交付物
`src/providers/ecs/lifecycle.ts`(start/reboot wrapper)、`src/commands/ecs-lifecycle.ts`(harness+命令)、`src/utils/cli-shared.ts`(ensureHighImpactActionConfirmed)、`auth-recovery.ts`/`ram.ts`(+Start/Reboot action)、`ecs.ts`(瘦身)、新增 ecs-lifecycle-*.test.ts

## 清洁度规则
禁调试输出 / TODO/FIXME / 注释代码 / 死 import

## 失败恢复边界
SDK 字段名不明 → 用 `@alicloud/ecs20140526` TS models 核实，不猜；不新增同名 shim
