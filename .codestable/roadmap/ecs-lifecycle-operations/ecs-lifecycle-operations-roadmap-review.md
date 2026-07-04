---
doc_type: roadmap-review
roadmap: ecs-lifecycle-operations
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-lifecycle-operations roadmap 审查报告

## 1. Scope And Inputs

- Roadmap: `.codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-roadmap.md`
- Items: `.codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-items.yaml`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md`（seed 输入）、`.codestable/attention.md`
- Code facts checked:
  - `src/providers/ecs/types.ts`（EcsInstanceSummary 无删除保护/磁盘/释放字段）
  - `src/providers/ecs/client.ts`、`src/providers/ecs/query.ts`（createEcsClient 返回 `{regionId, client}`；getEcsInstanceDetail）
  - `src/commands/ecs.ts`、`src/commands/module.ts`（CommandSafetyLevel='safe'|'mutating'|'destructive'；confirmFlags）
  - `src/utils/cli-shared.ts`（ensureDestructiveActionConfirmed 用"将删除云端资源"删除文案）
  - `src/utils/command-surface-metadata.ts:83`（collectConfirmFlags 只收集 --yes/--apply/--force）
  - `src/utils/auth-recovery.ts:10`（AuthCapability 固定 union + 独立 LABELS/ACTIONS map）
  - `src/providers/ram.ts:123-126`（LICELL_POLICY_ACTIONS 已含 ecs:CreateSecurityGroup / Describe*）

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `codex/gpt-5.5`（agentId 4e4277f7-d339-42a5-a154-62c06978da71），异构于主 agent 的 Claude Opus
- Raw output: 返回 1 blocking + 3 important + 1 nit + 1 suggestion + learning/praise/residual-risk（见下 Findings 逐条合并）
- Merge policy: 已逐条本地事实核验；全部有仓库证据支撑，采纳并在候选稿修复
- Gate effect: round 1 verdict = changes-requested；修复后本轮 round 2 定稿 passed

## 2. Roadmap Summary

- Goal completion signal: start/reboot/stop/rm 四个 mutating 命令各自走 preflight→plan→dry-run→确认→执行→bounded-polling verify 闭环，RAM 按命令最小授权
- Module split: A=mutating provider wrapper、B=lifecycle 命令 harness + 高危确认、C=auth/RAM 权限、D=命令 surface 同步
- Interface contracts: 4.1 provider 函数签名（含 getEcsInstanceReleaseFacts）、4.2 EcsLifecyclePlan/Result + EcsStatusClass taxonomy、4.3 ensureHighImpactActionConfirmed + 各命令确认规则、4.4 RAM 决策 A/B、4.5 descriptor safety 约定
- Items: 4 条，minimal_loop=ecs-lifecycle-start-reboot；风险热点=delete 释放前事实、RAM 扩权、reboot 确认、verify 过渡态
- Dependency shape: DAG 无环（1←2、1←3、{2,3}←4）

## 3. Findings

### blocking

- [x] RMR-001 `roadmap.md#4.1/4.2` / `seed:45` / `src/providers/ecs/types.ts:36` delete 释放前契约不可执行——EcsInstanceSummary 无删除保护/磁盘/释放字段，deleteEcsInstance 只有 force?，preflight 仅靠 getEcsInstanceDetail
  - Evidence: 已核验 types.ts 确无 deletionProtection/disks/deleteWithInstance 字段
  - Impact: 最危险命令的安全前置"文档说要显式但接口拿不到事实"
  - Resolution: 4.1 新增 `getEcsInstanceReleaseFacts` + `EcsInstanceReleaseFacts`（deletionProtection/disks[]/releaseBehavior）；约束改为事实不可读时**阻断执行**；4.2 plan 加 `releaseFacts`；delete item note 同步

### important

- [x] RMR-002 `roadmap.md#4.4` / `src/utils/auth-recovery.ts:10` / `src/providers/ram.ts:16` "决策 B items 不变"低估实现影响
  - Evidence: AuthCapability 是固定 union，label/actions 分离，命令带 requiredCapabilities
  - Resolution: 4.4 写清决策 B 需改 union/labels/CAPABILITY_ACTIONS/requiredCapabilities/auth-doctor 语义/bootstrap 默认策略；标注 items 不变但模块 C 实现分支不同，改 bootstrap 默认为二次拍板项；观察项同步
- [x] RMR-003 `roadmap.md#4.3/4.5` / `seed:43` reboot 确认策略在完成信号里缺失
  - Evidence: seed 标 reboot high-impact；原稿 Goal Matrix 只验证 stop
  - Resolution: 4.3 补各命令确认规则（start 免确认、reboot/stop 非交互需 --yes、delete 双确认）；4.5 confirmFlags 明确；Goal Coverage Matrix 加 start/reboot 确认行；start-reboot item note 同步
- [x] RMR-004 `roadmap.md#4.2` / `seed:42` verify 状态契约不稳定（过渡态抖动）
  - Evidence: ECS start/stop/reboot 常先返回 Starting/Stopping 过渡态，单次读易抖
  - Resolution: 4.2 引入 `EcsStatusClass` 归一 taxonomy + bounded polling verify（命中目标态返回、仅过渡态继续轮询、超时 timedOut 非失败告警）；Result 加 statusClass/reachedTarget/timedOut

### nit

- [x] RMR-005 `roadmap.md#模块C/4.4` / `src/providers/ram.ts:123` "bootstrap policy 同步追加 mutating action"措辞可能误导 ECS policy 当前纯只读
  - Evidence: 现有 policy 已含 ecs:CreateSecurityGroup / DescribeSecurityGroups
  - Resolution: 改为"在既有 ECS security group + read 权限基础上只追加本命令批准的 lifecycle action"

### suggestion

- [x] RMR-006 `items.yaml:ecs-lifecycle-start-reboot` 首条原子性偏大（harness+helper+provider+RAM+surface）
  - Resolution: 保留该条粒度（共享成本一次摊掉合理），在 item note 写明 design 阶段先做 harness+provider 契约测试再接 start 再接 reboot 确认

### learning

- collectConfirmFlags 只自动收集 --yes/--apply/--force（command-surface-metadata.ts:83）；任何新确认 flag 必须 descriptor 显式声明。roadmap 已采用"只用 --yes 不引入新 flag"规避。

### praise

- 范围边界清楚：明确不做 run/create、批量、跨 region 搜索，继承只读 seed 的 preflight/dry-run/verify 主线。
- interface seam 放在 provider 边界合理；createEcsClient 确实返回 `{regionId, client}`，可支撑 wrapper 返回实际 region。

### residual-risk

- ECS SDK 各 lifecycle Request 精确字段名（forceStop/stoppedMode/forceReboot/force/DeletionProtection/DeleteWithInstance）与 requestId 形状未联网核对；feature-design 须结合 `alicloud-ecs` reference / SDK types 确认。已在 4.1 约束中标注。
- 本轮修复直接落实 round-1 独立 reviewer 的具体建议（additive 契约细化，非架构改动），未再跑第二轮独立异构审查；如需可再派一次确认。

## 4. User Review Focus

- 用户需要重点拍板：
  1. **RAM 权限模型 决策 A（单 ecs capability 扩权，存量 operator 获操控权）vs 决策 B（独立 ecs-lifecycle capability，默认不授予）**——影响安全面与实现量。
  2. **stop / delete 谁先做**（技术上互不依赖，delete 最危险，建议后置）。
- 后续 feature-design 需重点复核：SDK 真实字段名、bounded polling 的 N/T 具体值、delete 释放保护读取的 API 选择。
- 不能靠 roadmap review 完全确认的点：真实云上过渡态时序、SDK 参数名。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Granularity Gate | pass | E | roadmap 2 节 Granularity Gate + 4 条独立可交付 item | none |
| Goal Coverage Matrix | pass | E | 5 节 Matrix 每核心信号有 item+验证入口+evidence | SDK 字段名 feature 阶段确认 |
| DAG and minimal loop | pass | E | items depends_on 无环；minimal_loop 唯一 true | none |
| Interface contract usability | pass | E/C | 4.1-4.5 写到函数签名/字段/错误分类级，经代码核验 | SDK 参数名（residual） |
| Module interface depth | pass | C | provider seam 已在只读 epic 验证可测；harness deep | none |

Summary: E=4, C=2(部分重叠), H-only core checks=none。

## 6. Residual Risk

- SDK 精确字段名与 requestId 形状未联网核对（见 3.residual-risk），feature-design 阶段用 alicloud-ecs reference 确认。
- 未跑第二轮独立异构审查确认修复；修复为 reviewer 明确建议的 additive 细化，风险低，可按需补一轮。
- 决策 B 若被选中且改 bootstrap 默认授予，安全影响需用户二次确认。

## 7. Verdict

- Status: passed
- Next: 交给用户 review（附 RAM 决策 A/B 与 stop/delete 优先级两个拍板项）
