# goal-feature: ecs-lifecycle-stop

- Roadmap item: `ecs-lifecycle-stop`
- Feature 性质: functional
- 依赖: ecs-lifecycle-start-reboot（复用 harness、ensureHighImpactActionConfirmed、mutating provider seam）

## 产物路径
- design: `.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-design.md`
- checklist: `.codestable/features/2026-07-03-ecs-lifecycle-stop/ecs-lifecycle-stop-checklist.yaml`
- design-review: `.../ecs-lifecycle-stop-design-review.md`（passed）
- review/qa/acceptance: `.../ecs-lifecycle-stop-{review,qa,acceptance}.md`（goal 执行时生成）

## 核心运行路径（functional 必填）
- `ecs stop i-x --dry-run --output json`（Running）→ willExecute=false，StopInstance 未被调用
- `ecs stop i-x --yes`（Running）→ 确认通过调 StopInstance，verify 到 stopped-like
- `ecs stop i-x` 非交互无 --yes → 抛错指明需 --yes，不调 StopInstance

## 必跑命令
- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts`
- `bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts`
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts`

## Feature DoD / stage gates
- implementation.before_review: scope-gate / dod-runner / evidence-pack；steps 全 done；清洁度
- review.before_pass: 独立 reviewer；无 unresolved blocking
- qa.before_acceptance: 核心运行路径实际证据；覆盖 S1-S11
- acceptance.before_done: checks 全 passed；roadmap item 回写

## Gate 输入产物
design、checklist、evidence pack、gate results、git diff

## 失败恢复路径
- review blocking → review-fix 重跑；QA failed → qa-fix 重跑 review+QA
- 需改 feature1 harness 契约 → handoff（不顺手改 harness 签名）

## 验收证据
provider 单测（StopInstance shape）、harness stop 分支单测（running-like precheck、dry-run 不调、超时 timedOut）、命令测试（非交互无 --yes 抛错、中断文案不含删除、result.fields）、guard（暴露 stop 不暴露 delete）、RAM（StopInstance 不含 DeleteInstance）

## 交付物
`src/providers/ecs/lifecycle.ts`(+stopEcsInstance)、`src/commands/ecs-lifecycle.ts`(+stop 命令/action)、`auth-recovery.ts`/`ram.ts`(+StopInstance)、tests

## 清洁度规则
禁调试输出 / TODO/FIXME / 注释代码 / 死 import

## 失败恢复边界
SDK StopInstance/ForceStop/StoppedMode 字段名用 SDK types 核实；不新增同名 shim
