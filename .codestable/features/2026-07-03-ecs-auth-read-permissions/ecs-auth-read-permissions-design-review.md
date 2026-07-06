---
doc_type: feature-design-review
feature: 2026-07-03-ecs-auth-read-permissions
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-auth-read-permissions feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`
- Code facts checked: `src/utils/auth-recovery.ts`, `src/providers/ram.ts`, `src/providers/doctor-cloud.ts`, `src/__tests__/ram-bootstrap.test.ts`, `src/__tests__/doctor-cloud.test.ts`, `src/__tests__/doctor-cloud-integration.test.ts`

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `f20262be-f0f7-4dec-9bc2-c33a22154156`
- Raw output: 第一轮审查确认权限边界和迁移语义正确，但提出 4 条 important：doctor probe seam / 测试落点未指定、RAM capability coverage 数组漏 `ecs`、mutating action 负向断言未落测。
- Merge policy: 已逐条核验并修订 design/checklist。
- Gate effect: rerun required

### Round 2 Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `2c1316eb-14c1-4775-9486-a8e7b9675cb1`
- Raw output: 复审确认 F1-F4 全部解决，无 blocking / important，仅保留 provider 未落地的跨 feature 顺序 residual-risk。
- Merge policy: 已逐条核验；design/checklist 已将 `runCapabilityProbe(auth, 'ecs', false)` 作为 core 单测 seam，并把 RAM policy 正负向断言写入 checklist。
- Gate effect: none

## 2. Design Summary

- Goal: 把 ECS 只读查询接入 auth capability、bootstrap RAM policy 和 doctor optional probe，供后续 `ecs list/info` 消费。
- Key contracts: `AuthCapability='ecs'`、`AUTH_CAPABILITY_LABELS.ecs`、`resolveAuthCapabilityActions(['ecs'])`、`LICELL_POLICY_ACTIONS` 新增两个 ECS Describe action、doctor optional probe 调 `listEcsInstances({ limit: 1 })`。
- Steps: 5 步，风险热点是 capability/action/label 漂移、RAM policy 权限过宽、doctor optional warn 被误当 failure。
- Checks: 覆盖不注册命令、不实现 provider、不新增 mutating action、不改 bootstrap preflight 短路、doctor warn 和无副作用。
- Baseline / validation: `bun run typecheck`、auth/RAM/doctor vitest、doctor-cloud integration test、checklist YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 doctor ECS probe 的 S5/S6 观测 seam 不存在：已明确导出已有 `runCapabilityProbe()` 作为测试 seam，`probeEcsCapability()` 保持私有。
- FDR-002 S5/S6 证据落点与 core CMD 不对齐：已指定落在 `doctor-cloud.test.ts`，通过 `vi.mock('../providers/ecs')` 观察 `listEcsInstances({ limit: 1 })`。
- FDR-003 `ram-bootstrap.test.ts` capability coverage 数组漏 `ecs`：已写入 Step 1 exit signal。
- FDR-004 mutating action 负向断言未落测试：已写入 Step 2 exit signal 和 checklist check。

### nit

none

### suggestion

- 后续可把 `ram-bootstrap.test.ts` 的 hard-coded capability 数组改为从 capability 全集派生，降低下一个 capability 再次漏测的风险；本 feature 不强制。

### learning

- 新增 capability 时，TypeScript `Record<AuthCapability, ...>` 只保证 key 存在，不能保证 value 内容安全；label/action/probe 和 RAM policy 都需要显式单测。

### praise

- design 正确区分 capability action hints 与 bootstrap / repair 的真实 policy 落点，避免误以为新增 preflight hint 就能覆盖存量 bootstrap operator。
- doctor optional warn 的迁移语义清楚：旧 operator 可见 ECS permission warn，引导管理员 `licell auth repair`，但不升级为 doctor failure。

## 4. User Review Focus

- 用户需要重点拍板：已确认接受 ECS 进入全员 doctor optional 探测；存量 bootstrap operator 需要管理员重新 `licell auth repair`。
- implement 需要重点遵守：只加入 `ecs:DescribeInstances` / `ecs:DescribeInstanceAttribute`，不提前加入 lifecycle action。
- code review / QA / acceptance 需要重点复核：RAM policy 正负向断言、doctor warn 分类、`runCapabilityProbe()` 导出是否只作为测试 seam 使用。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 与 checklist steps 覆盖 capability、policy、doctor probe、migration warn、scope guard | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、auth/RAM/doctor tests、integration smoke、YAML 校验 | none |
| Steps and checks traceability | pass | E | 5 个 step 均有 yes/no exit signal，checks 可追溯到范围守护、名词契约、编排和流程约束 | none |
| Roadmap contract compliance | pass | E/C | roadmap §4.3 要求的 `ecs` capability、RAM Describe action、doctor optional probe 均在 design/checklist 中落地 | none |
| Module interface design | pass | E/C | design §2.1 明确 auth/RAM/doctor 三个 seam，`runCapabilityProbe()` 是最小测试 seam | none |
| Validation and artifacts | pass | E | 必跑命令和后续 review/QA/acceptance artifacts 已列出 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- `listEcsInstances()` public export 依赖前置 `ecs-readonly-provider` 落地；roadmap `depends_on` 已跟踪。实现本 feature 前必须确认 provider facade 已可 import，否则 typecheck 应阻塞。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；等待所有 child feature design-review 通过后统一给用户确认。
