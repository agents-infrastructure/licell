---
doc_type: roadmap
slug: ecs-lifecycle-operations
status: active
created: 2026-07-03
last_reviewed: 2026-07-03
tags: [ecs, lifecycle, mutating, safety]
related_requirements: []
related_architecture: []
---

# ECS 实例生命周期操控命令

## 1. 背景

只读 epic `ecs-operations-support` 已交付 `ecs list` / `ecs info`，并落盘了 `ecs-operations-support/ecs-lifecycle-command-seeds.md`，把后续生命周期操控命令的安全契约、RAM 边界、dry-run/verify 流程写成了下一步的输入。本 epic 消费那份 seed，开放 ECS 实例的电源与释放类操控命令：`start`、`reboot`、`stop`、`rm`/`delete`。

这些命令会真实修改云端资源，其中 `stop` 会造成业务中断、`rm` 会释放实例，属于高风险操作。所以本 epic 的核心不是"能调 API"，而是"每个 mutating 命令都走统一的 preflight → plan → dry-run → 确认 → 执行 → verify 闭环，且 RAM 权限按命令最小授予"。

## 2. 范围与明确不做

### 本 roadmap 覆盖
- `ecs start <instanceId>`：启动 stopped 实例（mutating）
- `ecs reboot <instanceId>`：重启 running 实例（mutating / 中断风险）
- `ecs stop <instanceId>`：停止 running 实例（destructive / 业务中断）
- `ecs rm <instanceId>` / `ecs delete <instanceId>`：释放实例（destructive / 不可逆）
- 一套可复用的 lifecycle 命令 harness：结构化 plan、dry-run、状态 precheck/幂等、执行后 verify
- 一个非删除语义的 high-impact/中断确认 helper（供 stop/reboot 使用）
- 按命令最小扩展的 ECS mutating provider wrapper 与 RAM action
- 命令 surface（catalog/help/completion/README/agent-surface/skill scaffold）同步到最终命令集

### 明确不做
- `ecs run` / `ecs create`（创建类操作）——涉及 image、network、disk、security group、cost plan，复杂度和只操控现有实例完全不同，另起独立 epic（见 seed `ecs-run-create-command`）。
- 批量操控（一次对多个实例 start/stop/rm）——本 epic 只做单实例 `<instanceId>`，批量另议。
- 跨 region 自动搜索实例——沿用只读命令语义，只在 `--region` 或当前 auth region 内操作。
- 迁移 / 变配 / 快照 / 磁盘等实例属性变更——不属于电源与释放语义。

### Granularity Gate

| 判断项 | 结论 |
|---|---|
| 为什么不是 single feature | 4 个独立可交付的 mutating 命令 + 一套共享 harness/确认/权限扩展；跨 provider/command/auth/docs 多模块；有 DAG 依赖和多阶段验证 |
| 为什么不是 brainstorm | 目标、命令集、安全契约、RAM 边界都已由 seed 明确到可执行级，无需再发散分诊 |
| roadmap 边界 | 覆盖 start/reboot/stop/rm 四命令及其安全闭环；明确不做 run/create、批量、跨 region 搜索 |
| 最小闭环 | 第 1 条 `ecs-lifecycle-start-reboot` 完成后，`ecs start --dry-run` / `ecs start` 可端到端跑通并 verify |

## 3. 模块拆分（概设）

```
ECS 实例生命周期操控
├── 模块 A：ECS mutating provider wrapper —— 封装 Start/Stop/Reboot/DeleteInstance 单实例调用
├── 模块 B：lifecycle 命令 harness —— 共享 preflight/plan/dry-run/precheck/verify + 高危确认
├── 模块 C：auth/RAM lifecycle 权限 —— 按命令最小扩展 capability actions 与 bootstrap policy
└── 模块 D：命令 surface 同步 —— catalog/help/completion/README/agent-surface/skill scaffold
```

### 模块 A · ECS mutating provider wrapper
- **职责**：在 `src/providers/ecs/lifecycle.ts` 暴露 `startEcsInstance` / `stopEcsInstance` / `rebootEcsInstance` / `deleteEcsInstance`，每个只发对应的单实例 ECS API，返回结构化 `{action, regionId, instanceId, requestId}`。不做批量、不做 precheck（precheck 归模块 B）。
- **承载的子 feature**：ecs-lifecycle-start-reboot（Start/Reboot）、ecs-lifecycle-stop（Stop）、ecs-lifecycle-delete（Delete）
- **触碰的现有代码 / 模块**：复用只读 epic 的 `createEcsClient`（`src/providers/ecs/client.ts`）；与 `query.ts` 平级新增 `lifecycle.ts`；barrel `src/providers/ecs.ts` 追加导出
- **Depth 判断**：deep——mutating 复杂度（请求构造、force/stoppedMode 参数、requestId 提取）封在 provider 内，命令层只拿到归一化结果

### 模块 B · lifecycle 命令 harness
- **职责**：把 seed "Common preflight" 固化为共享流程：读 detail → 构造 `EcsLifecyclePlan` → 状态 precheck/幂等校验 → `--dry-run` 时 `willExecute=false` 且不调 mutating API → 高危命令走确认 → 执行 → 再读 detail verify。同时提供非删除语义的高危/中断确认 helper。
- **承载的子 feature**：ecs-lifecycle-start-reboot（首建 harness）、被 stop/delete 复用
- **触碰的现有代码 / 模块**：`src/commands/ecs.ts` 扩展；`src/utils/cli-shared.ts` 复用 `ensureDestructiveActionConfirmed`（delete）并新增 `ensureHighImpactActionConfirmed`（stop/reboot）
- **Depth 判断**：deep——四个命令共用同一条闭环，行为差异收敛为 plan/precheck/confirm 策略参数，避免每命令各自发明

### 模块 C · auth/RAM lifecycle 权限
- **职责**：随每条命令 feature 在既有 ECS 权限基础上最小追加 lifecycle action：start→`ecs:StartInstance`、reboot→`ecs:RebootInstance`、stop→`ecs:StopInstance`、delete→`ecs:DeleteInstance`（delete 若走事实查询还需 `ecs:DescribeDisks` 等只读 action）。delete 与 start/reboot 分开 review。实现走决策 A 或 B（见 4.4）。
- **承载的子 feature**：每条命令 feature 各自扩展自己的 action
- **触碰的现有代码 / 模块**：`src/utils/auth-recovery.ts`、`src/providers/ram.ts`
- **Depth 判断**：shallow——只是 action 列表增量；关键在**决策**而非实现（见第 4.4 节决策点）

### 模块 D · 命令 surface 同步
- **职责**：让 catalog/help/JSON contract/completion/README/agent-surface/skill scaffold 反映最终命令集；替换只读 epic 遗留的"只暴露 list/info""无 lifecycle action"guard 断言。
- **承载的子 feature**：每条命令 feature 更新自己相关的 surface/guard 测试；ecs-lifecycle-surface-harden 做整体 docs:sync + 回归收口
- **触碰的现有代码 / 模块**：`src/utils/skills-scaffold.ts`、README generated block、`docs/reference/agent-surfaces.md`、shell completion、相关 `__tests__`
- **Depth 判断**：shallow——generator 驱动，主要是对拍与 guard 更新

## 4. 模块间接口契约 / 共享协议（架构层详设）

以下契约是各子 feature design 的**硬约束输入**。

### 4.1 ECS mutating provider wrapper（模块 A → 模块 B）

**方向**：命令 harness → provider
**形式**：函数调用，`src/providers/ecs/lifecycle.ts`

**契约**：
```
interface EcsLifecycleActionResult {
  action: 'start' | 'stop' | 'reboot' | 'delete';
  regionId: string;
  instanceId: string;
  requestId?: string;        // 从 ECS response body requestId 提取
}

startEcsInstance(input: { instanceId: string; regionId?: string }): Promise<EcsLifecycleActionResult>
rebootEcsInstance(input: { instanceId: string; regionId?: string; forceReboot?: boolean }): Promise<EcsLifecycleActionResult>
stopEcsInstance(input: { instanceId: string; regionId?: string; forceStop?: boolean; stoppedMode?: 'StopCharging' | 'KeepCharging' }): Promise<EcsLifecycleActionResult>
deleteEcsInstance(input: { instanceId: string; regionId?: string; force?: boolean }): Promise<EcsLifecycleActionResult>

// delete 释放前事实来源（RMR-001）：现有 EcsInstanceSummary 无删除保护/磁盘/释放字段，
// 必须新增只读事实查询，供 harness 构造 delete plan：
interface EcsInstanceReleaseFacts {
  instanceId: string;
  regionId: string;
  status?: string;
  deletionProtection?: boolean;              // DescribeInstances/DescribeInstanceAttribute 的 DeletionProtection
  disks?: Array<{ diskId: string; deleteWithInstance?: boolean; category?: string }>; // DescribeDisks
  releaseBehavior?: 'released' | 'retained' | 'unknown';  // 磁盘随实例释放的归纳结论
}

getEcsInstanceReleaseFacts(input: { instanceId: string; regionId?: string }): Promise<EcsInstanceReleaseFacts>
```

**约束**：
- 每个 wrapper 只发对应的单实例 ECS API（`StartInstance` / `RebootInstance` / `StopInstance` / `DeleteInstance`），不批量、不循环、不隐式重试 mutating 调用。
- `regionId` 缺省时复用 `createEcsClient` 的 auth region 解析；返回的 `regionId` 是实际使用值。
- 只有命令 harness 在确认与 precheck 通过后才调用；provider 自身不做 dry-run 判断、不做状态 precheck。
- `forceStop`/`stoppedMode`/`forceReboot`/`force` 为 optional；MVP 可暂不从 CLI 暴露，但签名先占位，默认走 ECS 默认行为。
- `getEcsInstanceReleaseFacts` 为只读，delete feature 用它读删除保护/磁盘/释放行为；若无法读取（权限或 API 缺失）必须返回可分类的 not-readable 错误，delete harness 据此**阻断**执行而非默认放行（RMR-001）。真实 SDK 的 `DeletionProtection`、磁盘 `DeleteWithInstance` 字段名以 `alicloud-ecs` reference / SDK types 为准，feature-design 阶段确认。

**Interface 设计检查**：
- Module / interface：provider 暴露 4 个动词函数，caller 只需知道"给 instanceId+region，返回是否成功与 requestId"
- Seam placement：seam 在 provider 边界，mutating SDK 细节（请求类型、参数名 `instanceId` vs `instanceIds`）不外泄到命令层
- Depth / locality：SDK 请求构造与 requestId 提取集中在 lifecycle.ts；命令层变化不波及 provider
- Dependency strategy：in-process；测试通过 mock ECS client（与只读 provider 测试同款）替身
- Adapter：production 用真实 `@alicloud/ecs20140526` client；test 用 mock client，非假 seam（只读 epic 已验证该 seam 可测）

### 4.2 lifecycle 命令 harness（模块 B 内共享）

**方向**：`ecs.ts` 各命令 action → 共享 harness
**形式**：函数调用

**契约**：
```
type EcsLifecycleAction = 'start' | 'stop' | 'reboot' | 'delete';

// 状态归一 taxonomy（RMR-004）：所有 precheck / verify 判断走归一类别，不裸比 ECS 原生字符串
type EcsStatusClass = 'running-like' | 'stopped-like' | 'transitional' | 'unknown';
// Running → running-like；Stopped → stopped-like；Starting/Stopping/Rebooting 等 → transitional

interface EcsLifecyclePlan {
  action: EcsLifecycleAction;
  regionId: string;
  instanceId: string;
  currentStatus?: string;                 // ECS 原生状态字符串
  currentStatusClass: EcsStatusClass;     // 归一类别，precheck 依据
  plannedRequest: Record<string, unknown>;// 将要发给 ECS 的请求形状
  requiredCapabilities: string[];         // 例：['ecs']
  requiresConfirmation: boolean;          // 该动作是否需要确认（start=false，reboot/stop/delete=true）
  willExecute: boolean;                    // --dry-run 时为 false
  // 仅 delete：释放前事实（来自 getEcsInstanceReleaseFacts），供确认与阻断（RMR-001）
  releaseFacts?: { deletionProtection?: boolean; deleteWithDisks?: boolean; releaseBehavior?: string };
}

interface EcsLifecycleResult {
  plan: EcsLifecyclePlan;
  execution?: { requestId?: string };      // dry-run 时缺省
  verify: {
    status?: string;                       // verify 时读到的 ECS 原生状态
    statusClass?: EcsStatusClass;
    reachedTarget: boolean;                // 是否已达目标态（transitional 视配置为 true/false）
    notFound?: boolean;                    // delete 成功后为 true
    timedOut?: boolean;                    // bounded polling 超时
  };
}
```

**约束**：
- harness 先用只读 epic 的 `getEcsInstanceDetail(instanceId, { regionId })` 读当前实例；查不到抛 not-found（沿用只读的 `not_found` 分类）。delete 额外调 `getEcsInstanceReleaseFacts`。
- 状态 precheck 与幂等走 `EcsStatusClass`：start 要求 `stopped-like`、reboot/stop 要求 `running-like`；已处于目标态时按幂等处理（明确提示，不报错为主）；`transitional` 时视为不可安全操作，提示稍后重试。
- **verify 策略（RMR-004）**：执行后做 **bounded polling**——按固定间隔重读 detail，最多 N 次 / 总时长 T（feature-design 定具体值），命中目标态类别即 `reachedTarget=true` 返回；仅剩 `transitional` 且未超时则继续轮询；超时则 `reachedTarget=false, timedOut=true` 并把最后观测状态写入 `verify`，命令以"已下发但未确认达终态"的非失败告警收尾（delete 读到 not-found 视为终态成功）。真实云上过渡态不算命令失败。
- `--dry-run` 时 `willExecute=false`、**不得调用任何 mutating provider 函数**，`execution` 缺省，`verify` 反映执行前状态或标记 skipped。
- JSON `result` 在 dry-run 与执行两种模式下字段形状稳定（差异仅 `execution` 是否存在与 `verify` 是否为执行前快照）。

### 4.3 高危 / 中断确认 helper（模块 B 共享）

**方向**：stop/reboot 命令 → 确认 helper
**形式**：函数调用，`src/utils/cli-shared.ts`

**契约**：
```
ensureHighImpactActionConfirmed(
  actionLabel: string,
  options: { yes?: boolean; interactiveTTY?: boolean; interruption?: boolean; confirmPrompt?: (message: string) => Promise<boolean> }
): Promise<void>
```

**约束**：
- 文案表达"中断 / 重启实例"风险，**不得复用** `ensureDestructiveActionConfirmed` 的"将删除云端资源"删除文案。
- 非交互且未给确认 flag 时抛出可执行错误，明确指出需要哪个 flag。
- **各命令确认规则（RMR-003）**：
  - `start`：非破坏、`requiresConfirmation=false`，非交互可直接执行，无需确认 flag。
  - `reboot`：中断风险，`requiresConfirmation=true`，走本 helper；**非交互必须显式 `--yes`**，否则抛错。
  - `stop`：中断 + destructive，`requiresConfirmation=true`，走本 helper；非交互必须显式 `--yes`。
  - `delete`：走现有 `ensureDestructiveActionConfirmed`（`--yes` + 双确认），不走本 helper。
- 统一复用已自动收集的 `--yes`（`collectConfirmFlags` 已识别），不引入 `--confirm-stop` 等新 flag，避免 surface metadata 漏收（若确有必要新增，必须在 descriptor `safety.confirmFlags` 显式声明）。

### 4.4 auth/RAM lifecycle action 扩展（模块 C 共享数据）· **决策点**

**契约**：
```
// src/utils/auth-recovery.ts
CAPABILITY_ACTIONS.ecs  // 只读：['ecs:DescribeInstanceAttribute','ecs:DescribeInstances']
                        // 随命令增量：+ ecs:StartInstance / ecs:RebootInstance / ecs:StopInstance / ecs:DeleteInstance
// src/providers/ram.ts
LICELL_POLICY_ACTIONS   // 现有已含 ecs:DescribeSecurityGroups / ecs:CreateSecurityGroup / Describe*；
                        // 在既有 ECS 权限基础上，只追加本命令批准的 lifecycle action（RMR-005）
```

**约束 / 待用户拍板的决策**：
- `confirmFlags` 自动收集（`collectConfirmFlags`，`src/utils/command-surface-metadata.ts:83`）**只识别 `--yes`/`--apply`/`--force`**；若引入新 flag，必须在 descriptor `safety.confirmFlags` 显式声明，否则 help/catalog/completion 不会暴露。
- 注意（RMR-005）：现有 bootstrap policy 并非纯只读——已含 `ecs:CreateSecurityGroup` 等。lifecycle 扩展是在既有 ECS 权限**基础上追加**，不是从零加 mutating。既有安全组权限不属于本 lifecycle 范围，不据此扩展实例操控权限。
- **决策 A（默认提案）**：继续用单一 `ecs` capability，随命令逐步把 mutating action 加进 `CAPABILITY_ACTIONS.ecs` 与 bootstrap policy。代价：存量 bootstrap operator 在下次 `auth repair` 后会获得 start/stop/reboot/delete 权限，攻击面扩大。实现面小：只改 action 列表 + 相关测试。
- **决策 B（备选）**：新增独立 capability（如 `ecs-lifecycle`），mutating action 只进该 capability，不污染只读 `ecs`；bootstrap 默认不授予，需显式开启。**实现面比 A 大（RMR-002）**：需改 `AuthCapability` union、`AUTH_CAPABILITY_LABELS`、`CAPABILITY_ACTIONS` 新键、各 lifecycle 命令的 `requiredCapabilities`（从 `['ecs']` 改为含 lifecycle capability）、auth recovery / doctor probe 语义、以及 bootstrap 默认是否授予的策略；测试面相应扩大。
- 此决策留给用户在 review 时拍板。**items 条目本身不变，但模块 C 在每条命令 feature 内的实现分支不同**：A=扩 `ecs` action + 测试；B=新增 capability + 命令 requiredCapabilities + auth/doctor/metadata 测试 + bootstrap 默认策略拍板。若选 B 且改变 bootstrap 默认行为，这本身是二级用户拍板项。

> **用户已拍板（2026-07-03）：采用决策 A** —— 扩单一 `ecs` capability，随命令把 mutating action 加进 `CAPABILITY_ACTIONS.ecs` 与 `LICELL_POLICY_ACTIONS`。已知代价：存量 bootstrap operator 下次 `auth repair` 后获得对应操控权限，各命令 feature 的 acceptance 需提示这一点。

### 4.5 命令 descriptor safety 契约（模块 D 共享约定）

**约束**（每条 lifecycle 命令 descriptor 必须显式设置，不依赖命令名推断）：
- `safety.level`：start=`mutating`、reboot=`mutating`、stop=`destructive`、rm/delete=`destructive`（现有类型只有 safe/mutating/destructive，stop 的"中断"语义靠 destructive + 文案表达）
- `safety.confirmFlags`：reboot/stop/delete 列出 `--yes`（delete 另有双确认）；start 为空（RMR-003）
- `safety.reason`
- `automation.preferredOutput = 'json'`、`automation.explicitInputs`
- `recommendedFlow` 覆盖 dry-run → execute → verify 三阶段
- `result.fields` 覆盖 `plan.*`（含 `currentStatusClass`、`requiresConfirmation`、delete 的 `releaseFacts`）/ `execution` / `verify.*`（含 `statusClass`、`reachedTarget`、`timedOut`）

## 5. 子 feature 清单

1. **ecs-lifecycle-start-reboot** — 建 lifecycle harness 与高危确认 helper，落地 `ecs start` / `ecs reboot`，扩展 Start/Reboot 的 provider wrapper 与 RAM action
   - 所属模块：A + B + C + D（首建共享 harness）
   - 依赖：无（构建于只读 epic 既有 provider 之上）
   - 状态：planned
   - 对应 feature：未启动
   - 备注：最小闭环；harness 设计为可复用；guard 测试从"只暴露 list/info"更新为"暴露 list/info/start/reboot"

2. **ecs-lifecycle-stop** — 落地 `ecs stop`，复用 harness 与高危确认 helper，扩展 StopInstance
   - 所属模块：A + B + C + D
   - 依赖：ecs-lifecycle-start-reboot（复用 harness、`ensureHighImpactActionConfirmed`、mutating provider seam）
   - 状态：planned
   - 对应 feature：未启动
   - 备注：destructive level + 显式确认策略；precheck running-like 并提示中断风险

3. **ecs-lifecycle-delete** — 落地 `ecs rm` / `ecs delete`，复用 harness，接 `ensureDestructiveActionConfirmed` 双确认，扩展 DeleteInstance
   - 所属模块：A + B + C + D
   - 依赖：ecs-lifecycle-start-reboot（复用 harness、mutating provider seam）
   - 状态：planned
   - 对应 feature：未启动
   - 备注：destructive；`--yes` + 双确认；verify 以 not-found 为删除终态；RAM DeleteInstance 单独 review

4. **ecs-lifecycle-surface-harden** — 整体命令 surface 同步与回归收口
   - 所属模块：D
   - 依赖：ecs-lifecycle-stop, ecs-lifecycle-delete
   - 状态：planned
   - 对应 feature：未启动
   - 备注：`bun run docs:sync`/`docs:check`；catalog/help/completion/README/agent-surface/skill scaffold 对拍最终命令集；错误态/幂等/dry-run 契约统一回归；更新 seed 状态

**最小闭环**：第 1 条 `ecs-lifecycle-start-reboot` 做完后，`licell ecs start i-xxx --dry-run --output json` 能返回 `willExecute=false` 的 plan，`licell ecs start i-xxx` 能执行并 verify 到 running-like，端到端演示一条 mutating 命令的完整安全闭环。

### Goal Coverage Matrix

| Goal / completion signal | Covered by item(s) | Verification entry | Evidence type | Core? |
|---|---|---|---|---|
| `ecs start`/`reboot` 走 dry-run→execute→verify 闭环 | ecs-lifecycle-start-reboot | `bun run test` ecs lifecycle 测试；`ecs start --dry-run --output json` | test / command | yes |
| dry-run 时不调用 mutating provider | ecs-lifecycle-start-reboot（harness） | 单测断言 mock mutating 未被调用 | test | yes |
| start 非交互免确认；reboot 有中断确认、非交互需 `--yes` | ecs-lifecycle-start-reboot | 单测断言 reboot 非交互无 `--yes` 抛错、文案不含"删除"；start 非交互直接执行 | test | yes |
| verify 用 bounded polling + 状态归一，过渡态不误判失败 | ecs-lifecycle-start-reboot（harness） | 单测覆盖 transitional→目标态、超时 `timedOut` 分支 | test | yes |
| stop 有独立中断确认文案、非交互需显式 flag | ecs-lifecycle-stop | 单测断言文案不含"删除"、非交互抛错 | test | yes |
| rm/delete 双确认 + 释放前事实阻断 + verify not-found | ecs-lifecycle-delete | 单测覆盖确认路径、`releaseFacts` 不可读时阻断、删除终态 | test | yes |
| RAM policy 只含已批准命令 action | 各命令 feature | `ram-bootstrap.test.ts` / auth hints 断言 | test | yes |
| catalog/help/completion 反映最终命令集 | ecs-lifecycle-surface-harden | `bun run docs:check`、cli-help-json-contract | test / command | yes |
| 只读 guard 不再误报"只暴露 list/info" | 各命令 feature + harden | 更新后的 guard 测试通过 | test | yes |

## 6. 排期思路

按"先建可复用安全闭环，再逐命令扩风险，最后收口"排：第 1 条同时建 harness/确认/provider seam 并落地风险最低的 start/reboot（非破坏性、可逆），既是最小闭环又摊掉全 epic 的共享成本；stop 与 delete 各自独立依赖第 1 条、互不依赖；**用户已定先 stop 后 delete**（2026-07-03，delete 最危险放后）；第 4 条收口在两条破坏性命令都落地后做整体 docs:sync 与回归。卡点主要是第 4.4 节的 RAM 权限模型决策（决策 A/B），需用户在 review 时拍板，否则模块 C 实现方向不定。

## 7. 观察项

- **RAM 权限模型（决策 A vs B）**：默认按单 `ecs` capability 增量扩权（决策 A，实现面小）拆解；决策 B（独立 `ecs-lifecycle` capability）实现面更大——需改 `AuthCapability` union、labels、命令 `requiredCapabilities`、auth/doctor 语义与 bootstrap 默认策略（详见 4.4，RMR-002）。items 条目不变但模块 C 实现分支不同。请在 review 时明确，选 B 且改 bootstrap 默认行为时需二次拍板。
- 只读 epic `ecs-operations-support/ecs-lifecycle-command-seeds.md` 的 "Current guard requirement" 断言会随本 epic 命令落地而失效，需在各 feature 内更新而非留到最后，否则测试红。
- `ecs run`/`create` 不在本 epic；若用户后续要，另起 epic 并处理 image/network/disk/cost。
- acceptance 收尾时，high-impact 确认 helper 约定、RAM lifecycle 扩权决策、dry-run/verify 契约建议沉淀到 attention/decide（`cs-keep`/`cs-domain`）。
