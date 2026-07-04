---
doc_type: feature-design-review
feature: 2026-07-03-ecs-lifecycle-start-reboot
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-lifecycle-start-reboot design 审查报告

## 1. Scope And Inputs
- Design: `ecs-lifecycle-start-reboot-design.md`、checklist
- 硬约束：roadmap `ecs-lifecycle-operations` §4.1-§4.5
- Code facts: `src/providers/ecs/{client,query,types}.ts`、`src/commands/module.ts`、`src/utils/cli-shared.ts`、`command-surface-metadata.ts:83`

### Independent Review
- Status: completed；Detection: paseo；Provider: `codex/gpt-5.5`（agentId 7d74a7c3），异构于主 agent
- Merge policy: 逐条本地核验后合并；round-1 verdict=changes-requested（2 blocking），修复后 round-2 passed

## 2. Findings

### blocking
- [x] FDR-001 §2.1 vs roadmap §4.2：`EcsLifecycleAction` 窄化为 `'start'|'reboot'`，违反 roadmap 完整 union
  - Evidence: 已核验 roadmap:139 定义 `'start'|'stop'|'reboot'|'delete'`
  - Resolution: §2.1 改为按完整 union 定义共享类型，本 feature 只实现 start/reboot，stop/delete 分支标 not-implemented；checklist step/checks 同步
- [x] FDR-002 §2.2/§3：reboot 的 precheck/幂等/verify 互相打架（running-like 既是源态又是目标态，可能实现成 no-op）
  - Evidence: A5 要求 Running 调 RebootInstance，但"已在目标态幂等"会把 Running 当已完成
  - Resolution: 新增 per-action 语义表（allowedSourceClass/idempotentWhen/verifyTargetClass）；reboot running-like 明确为可执行非幂等态，verify=命令已下发+bounded post-check，不用同态证明完成

### important
- [x] reboot dry-run 无独立验收：新增 A11（`ecs reboot --dry-run` 无 --yes 返回 requiresConfirmation=true/willExecute=false，不确认不 mutating）
- [x] §2.5 微重构边界含糊：收紧为 ecs-lifecycle.ts 导出 descriptors+register，ecs.ts 只导入/合并/注册，list/info 不搬或机械移动锁测试

### nit
- [x] SDK 假设用 PascalCase：改 plannedRequest 为 lowerCamel JSON 投影，注明 SDK 构造以 TS models 为准、provider 单测锁定

### suggestion
- [x] 补 result shape 断言：新增 A12 field-level result.fields + dry-run/execute 形状稳定

### learning
- reboot 这类执行前后同为 running-like 的操作，verify 只能证明"API accepted + bounded post-observation"，不能用目标态类别单独证明完成

### praise
- dry-run 分流置于确认与 mutating 之前；复用 --yes 合 collectConfirmFlags 现状；新增 high-impact helper 不复用删除文案

### residual-risk
- SDK Start/Reboot request 字段与 requestId 位置需 implement 用 `@alicloud/ecs20140526` types 核实
- 30s bounded polling 量级需真实云 smoke / acceptance 验证，保留为可调常量

## 3. Verdict
- Status: passed
- Next: 返回 cs-epic 批量流程，design 保持 draft 等统一确认
