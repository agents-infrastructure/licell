---
doc_type: feature-review
feature: 2026-07-03-ecs-lifecycle-start-reboot
reviewer: subagent
status: passed
reviewed: 2026-07-04
---

# ecs-lifecycle-start-reboot 代码审查报告

## 1. 审查范围与输入

只读审查（未修改任何源代码或测试）。已通读以下输入：

- Design：`ecs-lifecycle-start-reboot-design.md`（第 3 节验收契约 A1-A12、per-action 语义表 FDR-002、bounded polling 假设）
- Checklist：`ecs-lifecycle-start-reboot-checklist.yaml`（7 steps 全 done，17 checks，DoD CMD-001~005）
- Evidence pack + `dod-results.json`：DoD gate `status=passed`，5 条命令 `exit_code=0`，blocking=[]，warnings=[]
- Git 改动核对：`git status --short` + 直接读取 untracked 新文件

核心交付物已逐一阅读：

- `src/providers/ecs/lifecycle.ts`（新增，startEcsInstance/rebootEcsInstance）
- `src/providers/ecs/types.ts`（新增 EcsLifecycleAction/EcsStatusClass/EcsLifecycleActionResult）
- `src/providers/ecs.ts`（barrel 追加导出）
- `src/commands/ecs-lifecycle.ts`（新增 harness + 两条命令 descriptor + register）
- `src/commands/ecs.ts`（合并 commands 数组、调用注册；list/info 未搬未改）
- `src/utils/cli-shared.ts`（新增 ensureHighImpactActionConfirmed）
- `src/utils/auth-recovery.ts`、`src/providers/ram.ts`（RAM Start/Reboot action）
- `src/providers/ecs/client.ts`、`query.ts`（依赖，query.ts 未改动）
- 新增/改动测试：`ecs-lifecycle-command.test.ts`、`ecs-lifecycle-provider.test.ts`、`cli-help-json-contract.test.ts`、`command-manifest.test.ts`、`shell-completion.test.ts`、`auth-recovery.test.ts`、`ram-bootstrap.test.ts`
- 对照 `@alicloud/ecs20140526` 的 `.d.ts` 核实 SDK 字段名

## 2. 逐项验收契约核对（A1-A12 + 流程级约束）

| # | 结论 | 证据 |
|---|---|---|
| A1 dry-run 不触发 mutating（start） | 通过 | `ecs-lifecycle.ts` dry-run 分流点在 `startEcsInstance` 调用之前（幂等判定→precheck→dry-run 返回→execute）；command test `ecs start --dry-run ... does NOT call startEcsInstance` 断言 mock 未被调用，plan.willExecute=false |
| A2 start 执行 + verify | 通过 | 非 dry-run 调 `startEcsInstance`，随后 `pollForVerify(['running-like','transitional'])`；test 断言调用参数 `{instanceId, regionId}` 且 emitCommandResult 输出含 execution |
| A3 start 幂等（已 Running） | 通过 | `currentStatusClass==='running-like'` 分支先于 precheck 返回，`willExecute=false`、`verify.reachedTarget=true`，不调 startEcsInstance；test 覆盖 |
| A4 reboot 非交互无 --yes 抛错不调 | 通过 | dry-run=false 时调用 `ensureHighImpactActionConfirmed`（yes=false, 非交互）抛错，位于 `rebootEcsInstance` 之前；test 断言 caught 匹配 `/--yes/` 且 reboot mock 未调用 |
| A5 reboot --yes 走确认执行 | 通过 | test 断言 `ensureHighImpactActionConfirmed('重启实例', {yes:true})` 被调、rebootEcsInstance 调用一次 |
| A6 reboot 文案不含"删除" | 通过 | `ensureHighImpactActionConfirmed` 文案为「会中断实例运行」；与 `ensureDestructiveActionConfirmed`（「将删除云端资源」）分离，为独立 helper |
| A7 not_found 归类 | 通过 | `getEcsInstanceDetail` 查不到抛 `ECS instance not exist`；`isNotFoundError` 命中 `not exist`，`output.ts` 归类 `not_found`→`RESOURCE_NOT_FOUND`。属于既有只读路径复用，本 feature 未新增专门单测但链路成立 |
| A8 verify transitional 超时非失败 | 通过 | `pollForVerify` bounded loop（6 次/5s），命中目标类别即返回；否则 `timedOut=true`，命令层不抛错，打印 warning「已下发，暂未确认到达目标状态」 |
| A9 catalog/help/completion 暴露面 | 通过 | help-json 契约测试断言 ecs namespace subcommands 恰为 4 项（list/info/start/reboot），JSON 不匹配 stop/delete/rm/run/create；completion/manifest 测试同步更新 |
| A10 RAM 含 Start/Reboot 不含 Stop/Delete | 通过 | ram-bootstrap/auth-recovery 测试断言 policy/hints 含 StartInstance/RebootInstance，显式排除 StopInstance/DeleteInstance/RunInstances |
| A11 reboot --dry-run 无 --yes 不确认不 mutating | 通过 | dry-run 分流在 `ensureHighImpactActionConfirmed` 之前返回，`requiresConfirmation=true, willExecute=false`；test 断言 confirm 与 reboot mock 均未调用 |
| A12 help result.fields 形状 | 通过 | 两命令 descriptor result.fields 覆盖 plan.action/regionId/instanceId/currentStatusClass/requiresConfirmation/willExecute、execution.requestId、verify.statusClass/reachedTarget/timedOut；dry-run 与 execute 下 plan/verify 形状稳定，仅 execution 缺省 |

流程级约束补充核对：

- provider wrapper 名词契约：`startEcsInstance` 只发 `StartInstance`、`rebootEcsInstance` 只发 `RebootInstance`，均单实例、无 for 循环批量、无 retry；provider test 断言 `toHaveBeenCalledTimes(1)` 与 request shape，空 instanceId 在调用前抛错。
- SDK 字段名：核对 `.d.ts` — `StartInstanceRequest.instanceId?`、`RebootInstanceRequest.instanceId?` 与 `forceStop?` 均存在。lifecycle.ts 用 `instanceId` 与 `forceStop`（由 `forceReboot` 映射），与 SDK 一致，消解了 design 决策 3 的 residual risk。
- start 免确认、reboot 需确认：命令层直接体现（start 无 confirm 调用，reboot 有）。
- 复用 --yes、不引入 --confirm-stop：reboot 仅新增 `--yes`，无新确认 flag。

bounded polling 量级评估：6 次 × 5s ≈ 30s 上限，命中目标态提前返回，量级可接受（与 design 决策 2 一致）。poll 内 `catch{}` 吞错重试为「尽力验证」语义，不会把验证阶段的瞬时读失败升级为命令失败，合理。

## 3. 范围守护核对（stop/delete 未泄漏）

- 类型：`EcsLifecycleAction = 'start' | 'stop' | 'reboot' | 'delete'` 按 roadmap 完整 union 定义，未窄化（符合 FDR-001）。
- provider：`lifecycle.ts` 只导出 start/reboot 两个 wrapper，无 stop/delete。
- 命令：仅注册 `ecs start` / `ecs reboot`；`ecsCommandModule.commands` 为 4 项。无 stop/delete/rm/run/create 命令。
- RAM：`CAPABILITY_ACTIONS.ecs` 与 `LICELL_POLICY_ACTIONS` 仅追加 StartInstance/RebootInstance，diff 干净。
- guard 测试：completion 断言 start/reboot 暴露、stop/delete/rm/run/create 不暴露；help-json 用正则 `ecs (stop|delete|rm|run|create)` 与 `ecs:(StopInstance|DeleteInstance|RunInstances)` 反向断言不出现。
- 生成文档：`README*` 与 `docs/reference/agent-surfaces.md` 无 diff（收口留给 surface-harden，符合明确不做）。
- `query.ts` 只读路径无 diff。

范围守护整体成立。

## 4. Gate 与 Provider 警告解释

- DoD gate：`status=passed`，5 条命令 exit_code 全 0（typecheck、ecs-lifecycle*、manifest/help/completion、auth/ram、yaml 校验），blocking 与 warnings 均空。证据可信。
- Provider Signals：
  - `archguard`：`available` 但「risk summary not collected in this minimal mode」。这是采集模式为 minimal、未产出架构风险摘要，属工具运行档位限制，非代码缺陷；本 feature 改动局限于 ECS provider/命令/RAM 平级新增，无跨层结构风险，可接受。
  - `meta_cc`：`unavailable`（summary 文件缺失，realtime session 采集 out of scope）。属证据采集环境缺项，不影响代码正确性判断，可接受。
- Gate Results 为空对象 `{}`：本阶段未配置额外 gate，符合 evidence pack 结构。

两条 provider warning 均为「证据采集完整度」层面的降级，不构成 blocking。

## 5. Findings

- REV-001（non-blocking）`src/commands/ecs.ts:442` — namespace `agentTips` 出现「ECS Start/Reboot/**Stop/Delete** 会使用独立的 StartInstance/RebootInstance/**StopInstance/DeleteInstance** API」。stop/delete 命令本 feature 尚未实现，此处提前描述未落地能力略超当前交付面。它未触发范围守护正则（因为文本用的是裸词 `StopInstance` 而非 `ecs:StopInstance` 或 `ecs stop`），故 help-json 测试仍通过；也未泄漏为真实命令/wrapper/RAM。建议 surface-harden 阶段收敛该文案或随 stop/delete feature 一并生效。理由：文档前瞻性描述，非功能缺陷。

- REV-002（non-blocking）`src/commands/ecs.ts:431` — namespace summary「停止和删除命令会按安全设计在后续发布」同属前瞻性文案，观感一致性问题，建议与 REV-001 一并在 surface-harden 处理。

- REV-003（non-blocking，观察项）A7（not_found）无独立命令级单测。链路（`getEcsInstanceDetail` 抛 `not exist` → `isNotFoundError` → `not_found`）经源码核实成立，但依赖只读 epic 既有行为，本 feature 未新增针对 start/reboot 的 not_found 断言。建议 QA 补一条针对 `ecs start i-missing --output json` 的 not_found 归类验证。理由：覆盖完整性，非缺陷。

- REV-004（non-blocking，观察项）`pollForVerify` catch 分支静默吞掉读取异常并继续重试。对 bounded verify 是合理的「尽力而为」策略，但若目标实例在 verify 期间恰好被授权/网络问题持续阻断，最终只表现为 `timedOut=true` 而丢失根因。当前告警文案已提示「暂未确认到达目标状态」，可接受；QA 可留意此语义。

无 blocking finding。清洁度：新文件无 TODO/FIXME/debugger/console.debug/注释代码/死 import（已 grep 核实）。

## 6. Test And QA Focus

交给 QA 的验证重点：

1. dry-run 双负例（A1/A11）：真实 CLI 跑 `ecs start i-x --dry-run --output json`（Stopped）与 `ecs reboot i-x --dry-run --output json`（Running 无 --yes），确认 JSON 无 execution 且底层无 mutating 调用。
2. reboot 确认闸（A4/A5）：非交互无 --yes 抛错并含 `--yes` 指引；`--yes` 路径实际下发。
3. 幂等与 precheck 边界（A3、transitional）：start 遇 Running 幂等、遇 Starting/Stopping 过渡态提示重试；reboot 遇 Stopped/过渡态拒绝。
4. verify 超时语义（A8）：构造实例长期 transitional，确认 `timedOut=true` 且退出码非失败、有 warning。
5. not_found（A7，REV-003）：`ecs start i-missing --output json` 的 error.category=not_found。
6. RAM 端到端（A10）：存量 bootstrap operator `auth repair` 后确认获得 StartInstance/RebootInstance，且不含 Stop/Delete。
7. help/completion 暴露面（A9）：人工确认 `ecs --help` 与补全只出 list/info/start/reboot。

## 7. Verdict

**status: passed**

- unresolved blocking findings：0
- non-blocking findings：4（REV-001~004，均为文案前瞻性或覆盖完整度观察项，建议在 surface-harden / QA 阶段处理）

验收契约 A1-A12 与流程级约束、范围守护、名词契约、SDK 字段名、清洁度均满足；DoD gate 通过，provider warnings 为证据采集降级、可接受。同意进入 QA。
