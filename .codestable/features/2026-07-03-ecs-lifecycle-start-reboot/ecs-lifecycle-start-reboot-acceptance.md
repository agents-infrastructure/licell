---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-lifecycle-start-reboot
status: passed
accepted: 2026-07-04
roadmap: ecs-lifecycle-operations
roadmap_item: ecs-lifecycle-start-reboot
---

# ecs-lifecycle-start-reboot 验收报告

## 1. 验收结论

**status: passed**。review passed（0 unresolved blocking）、QA passed（0 failed/blocked）、DoD core 命令全绿、checklist steps 全 done、checks 全 passed、roadmap item 已回写。

## 2. 前置门校验

- review.before_pass：`ecs-lifecycle-start-reboot-review.md` status=passed，reviewer=subagent（独立 Task agent），无 unresolved blocking；`validate-implementation-review.py` ok=true。
- qa.before_acceptance：`ecs-lifecycle-start-reboot-qa.md` status=passed，核心运行路径 4 条 + A1-A12 全部实测证据，无核心缺口写成 residual-risk。
- implementation.before_review：scope-gate passed、dod-runner passed（CMD-001..005 exit 0）、evidence-pack 生成含 Scope/DoD/Validation/Cleanliness/Residual/Provider/Gate 七节。

## 3. DoD Results 复核

| ID | 命令 | core | 结果 |
|---|---|---|---|
| CMD-001 | `bun run typecheck` | ✅ | pass |
| CMD-002 | `bun x vitest run ecs-lifecycle-command/provider` | ✅ | pass（17） |
| CMD-003 | `bun x vitest run manifest/help/completion` | ✅ | pass（23） |
| CMD-004 | `bun x vitest run auth-recovery/ram-bootstrap` | ✅ | pass（10） |
| CMD-005 | `validate-yaml.py checklist` | 非core | pass |

## 4. 交付物清单

- `src/providers/ecs/lifecycle.ts`：`startEcsInstance`/`rebootEcsInstance`（单实例 Start/Reboot API，requestId 提取，空 id 校验）
- `src/providers/ecs/types.ts`：`EcsLifecycleAction`（完整 union）、`EcsStatusClass`、`EcsLifecycleActionResult`
- `src/providers/ecs.ts`：barrel 追加 lifecycle 导出
- `src/commands/ecs-lifecycle.ts`：harness（classifyEcsStatus、bounded pollForVerify）+ start/reboot descriptors + `registerEcsLifecycleCommands`
- `src/commands/ecs.ts`：导入 lifecycle、合并 commands、`registerEcsCommands` 调 `registerEcsLifecycleCommands`；list/info 行为不变
- `src/utils/cli-shared.ts`：`ensureHighImpactActionConfirmed`（非删除中断文案）
- `src/utils/auth-recovery.ts`：`CAPABILITY_ACTIONS.ecs` 追加 Start/Reboot
- `src/providers/ram.ts`：`LICELL_POLICY_ACTIONS` 追加 `ecs:StartInstance`/`ecs:RebootInstance`
- 测试：`ecs-lifecycle-command.test.ts`（11）、`ecs-lifecycle-provider.test.ts`（6）；guard 更新 command-manifest/cli-help-json-contract/shell-completion/auth-recovery/ram-bootstrap

## 5. 回写处理（design 第 4 节）

- **reference / architecture / requirement 回写**：本 feature design 无第 4 节强制 reference/architecture 回写项；harness 契约（EcsLifecyclePlan/Result 形状、EcsStatusClass 归一、per-action precheck 语义）已在代码与 review/QA 中固化，供 stop/delete feature 复用。无独立 architecture 文档需更新。
- **roadmap item 回写**：`items.yaml` 的 `ecs-lifecycle-start-reboot` 状态 in-progress → done。
- **generated docs**：按 design「明确不做」，README generated block 与 agent-surfaces.md 收口留给 surface-harden feature，本 feature 不手改。

## 6. 存量 operator 提示

按决策 A（扩单一 `ecs` capability）与 design 假设 4：存量 bootstrap operator 需重新执行 `licell auth repair` 后，其 RAM policy 才会补齐 `ecs:StartInstance`/`ecs:RebootInstance`，从而获得 start/reboot 操控权限。

## 7. Residual Risks（非核心）

- 真实阿里云 ECS Start/Reboot live 调用未做（会真实改云资源），核心由 mock/contract 证明；真实云 smoke 留待人工/后续。
- bounded polling 6×5s≈30s 初值常量，真实云收敛速度未实测；超时仅 timedOut=true 非失败。

## 8. Verdict

验收通过。checklist checks 全部置 passed。可推进至 feature 2（ecs-lifecycle-stop）。
