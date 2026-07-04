# ecs-lifecycle-operations Goal 执行计划

## 路径
- Roadmap: `.codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-roadmap.md`
- Items: `.codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-items.yaml`

## Feature 执行顺序（依赖 DAG）

1. **ecs-lifecycle-start-reboot**（无依赖，最小闭环）— 建共享 lifecycle harness + 高危确认 helper + `ecs start`/`ecs reboot`；性质：functional
2. **ecs-lifecycle-stop**（依赖 1）— `ecs stop`，destructive/中断；性质：functional
3. **ecs-lifecycle-delete**（依赖 1）— `ecs rm`/`ecs delete`，双确认 + 释放前事实阻断；性质：functional
4. **ecs-lifecycle-surface-harden**（依赖 2、3）— 命令 surface 同步与回归收口；性质：non-functional

顺序约束：1 先行（建 harness）；2、3 均依赖 1，用户已定**先 stop 后 delete**；4 收口在 2、3 都 accepted 后。

## Roadmap 级核心验收路径

功能性核心路径（必须真实运行）：
- `ecs start i-x --dry-run --output json` 返回 `willExecute=false` plan，mutating 未触发
- `ecs reboot i-x --dry-run`（无 --yes）返回 `requiresConfirmation=true, willExecute=false`，不确认不 mutating
- `ecs stop` 非交互无 `--yes` 抛错；`ecs rm` 非交互无 `--yes` 抛错、releaseFacts 不可读时阻断
- 全命令 catalog/help/completion 可发现，safety/confirmFlags 正确

真实阿里云 ECS live mutating call **不是**核心通过条件（会真实改/删云资源），核心路径由 mock/contract tests 证明；真实云 smoke 作为残余风险记录。

## 关键假设
- RAM 决策 A（扩单一 `ecs` capability），用户已拍板；存量 bootstrap operator 重新 auth repair 后获操控权，各 acceptance 提示。
- bounded polling verify 初值 6 次/5s（约 30s），implement 可微调为常量。
- 阿里云 SDK 精确字段名（Start/Stop/Reboot/DeleteInstance、DeletionProtection、DescribeDisks）implement 用 `@alicloud/ecs20140526` TS models 核实。

## Top 3 风险与缓解
1. dry-run 误触发 mutating — harness dry-run 分流置于确认与 provider 之前；每命令有 mock 断言未调用。
2. 释放前信息缺失下误删 — delete releaseFacts 不可读即阻断，deletionProtection=true 阻断。
3. 生命周期 guard 测试随命令落地漂移 — 每 feature 更新对应 guard；surface-harden 整体回归。

## 必跑验证命令集合
- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts`
- `bun x vitest run src/__tests__/command-manifest.test.ts src/__tests__/cli-help-json-contract.test.ts src/__tests__/shell-completion.test.ts`
- `bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts`
- `bun run docs:check`（surface-harden）

## 最终聚合命令集合（roadmap 完成前重跑）
- `bun run typecheck`
- `bun run test:ci`（文件级串行，全量 vitest）
- `bun run docs:check`
- `python3 .codestable/tools/codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/ecs-lifecycle-operations`

## 预检策略
每个 feature implement 前先跑该 feature 必跑命令的只读子集确认基线绿（当前基线：936 tests 全绿，稳定）；红灯先分清既有/本次引入。

## DoD Policy
每个 feature 的 checklist `dod.commands` core 命令必须有执行证据；`evidence_required` = command_output、diff_summary、review_report、qa_report、acceptance_report；清洁度禁调试输出/TODO/注释代码/死 import。

## Gate Policy
按 `goal-protocol-gates.md`：implementation.before_review 跑 scope-gate/dod-runner/evidence-pack；review.before_pass 需独立 reviewer；qa.before_acceptance 跑 qa-evidence-gate；acceptance.before_done 跑 acceptance-dod-gate；roadmap_audit.before_complete 跑 goal-consistency-gate。

## Provider Policy
- provider unavailable（archguard / meta-cc）不阻塞基础流程，记 fallback，不自动阻塞。
- provider warning 必须由 review / QA / audit 解释。
- 未解释的核心风险可阻塞。

## 验证工具缺失恢复策略
只能补测试依赖、锁文件或既有 runner 配置（如 `bun install`）；不新增同名 shim（`pytest.py`/`jest`/`vitest` 伪造），不伪造验证结果。缺 gate 脚本先重跑 `cs-onboard` 刷新骨架。

## 最终审计核验的交付物类型
- `src/providers/ecs/lifecycle.ts`（mutating wrapper + release facts）
- `src/commands/ecs-lifecycle.ts`（harness + start/reboot/stop/delete 命令）
- `src/utils/cli-shared.ts`（ensureHighImpactActionConfirmed）
- `src/utils/auth-recovery.ts`、`src/providers/ram.ts`（lifecycle RAM actions）
- 各 `src/__tests__/ecs-lifecycle-*.test.ts` 与更新的 guard 测试
- generated docs（README/agent-surfaces）+ skill scaffold + completion 同步
- roadmap item 与 goal state 回写；seed 状态更新

最终审计必须运行 `codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/ecs-lifecycle-operations`，并聚合 goal-evidence-summary、provider warnings、E/C/H summary 和 H-only core checks。
