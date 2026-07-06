---
doc_type: feature-design-review
feature: 2026-07-03-ecs-readonly-provider
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-readonly-provider feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, `.claude/skills/licell/SKILL.md`, `.claude/skills/alicloud-ecs/SKILL.md`, `.claude/skills/alicloud-ecs/references/instance.md`
- Code facts checked: `src/providers/vpc.ts`, `src/providers/infra/query.ts`, `src/providers/infra/client.ts`, `src/providers/infra/types.ts`, `src/providers/redis/query.ts`, `src/providers/redis/types.ts`, `src/utils/config.ts`, `src/utils/alicloud-error.ts`, `src/utils/output.ts`, `src/utils/cli-shared.ts`, `package.json`

### Independent Review

- Status: pending
- Detection: paseo
- Provider / agent: `claude/opus`, agent `7e61dc73-d88a-4fcf-93c5-899f7435ce8c`
- Raw output: 独立 reviewer 返回 1 条 blocking、5 条 important、2 条 nit、2 条 residual-risk、3 条 praise。
- Merge policy: 已逐条核验；B1 与 I1-I5 均已修入 design/checklist。由于 design/checklist 已发生实质变化，需重跑 design-review gate。
- Gate effect: rerun required

### Round 2 Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `776d0d19-5732-4c72-834c-c0619c313ece`
- Raw output: 第二轮复审确认 blocking=0、important=0；上一轮 B1/I1-I5 均已修复，仅剩 residual-risk / nit / suggestion。
- Merge policy: 已逐条核验；采纳 R1 与 S-1 的文字级澄清：`EcsClient` 类型不是只读安全边界，`namePrefix` 通配不可用时不得本地过滤伪装。无需第三轮复审。
- Gate effect: none

## 2. Design Summary

- Goal: 新增 ECS 只读 provider 查询层，先形成 `DescribeInstances` 查询、分页、过滤、summary normalization 和基础 detail/not-found 合同。
- Key contracts: `createEcsClient(regionId?)`、`listEcsInstances(options)`、`getEcsInstanceDetail(instanceId, options)`；provider 不泄漏 SDK raw response，不写项目状态。
- Steps: 6 步，风险热点是 SDK 字段 typecheck、filter request shape、not-found 语义和无副作用边界。
- Checks: 15 条，覆盖范围守护、名词契约、编排骨架、流程约束、验收场景和挂载点。
- Baseline / validation: `bun run typecheck`、`bun x vitest run src/__tests__/ecs-provider.test.ts`、checklist YAML 校验。

## 3. Findings

### blocking

none

已处理的 blocking：

- B1 detail not-found 示例错误消息无法被 `isNotFoundError()` 识别：已把示例改为 `ECS instance not exist: i-xxx`，并新增 error token contract，要求 message/code 包含 `not exist` / `notfound` / `no such`。

### important

none

已处理的 important：

- I1 input error 消息 token 未约束：已要求互斥/空输入错误消息包含 `无效` / `不能为空` / `不支持` / `invalid` 等分类 token。
- I2 `createEcsClient` facade surface 不一致：已明确它是有意导出的低层 provider seam，并定义 `EcsClient = Ecs` 的类型来源。
- I3 `publicIpAddress` 对 VPC 实例语义可能静默失配：已写入非显然依赖、超出范围观察和 checklist，禁止用本地过滤补假精确。
- I4 缺少反本地过滤负向测试：已在推进策略和 checklist 加入 mock 返回不匹配 filter 实例时 provider 原样返回的断言。
- I5 Step1 typecheck 软出口削弱核心闸门：已要求按 lockfile 恢复依赖后 `bun run typecheck` 必须真实通过，字段不可用只能触发 surface 修订。

### nit

none

已处理的 nit：

- N1 已在 normalization source paths 中列出代表性 response 嵌套路径和 `tagKey/tagValue -> key/value` 转换。
- N2 已在接口示例中补充 `createEcsClient('cn-shanghai')` 示例。

### suggestion

- S-1 namePrefix 通配语义未与 publicIp 语义风险对称加固：已在 filter mapping contract 中补充“不可用则调整 command surface，不得本地过滤伪装”。

### learning

- provider-only feature 的 scope 边界已经显式排除 command/auth/docs，实现阶段应继续用 diff review 防漂移。
- `typecheck` 只能证明 SDK 字段存在，不能证明云端语义命中；语义型 filter 必须用实现期校正 + 不可用则调整 surface 的方式处理。

### praise

- Error token contract 已把 not-found/input 两类错误的 message token 对齐到 `output.ts` 的分类关键词，并进入 checklist 断言。
- 反本地过滤负向测试把“服务端过滤 vs 本地过滤”变成可测行为，能防止 provider 后续漂移。

## 4. User Review Focus

- 用户需要重点拍板：等待独立 design review 返回后再整体确认本 design。
- implement 需要重点遵守：不做本地过滤伪装服务端过滤；SDK 字段必须经 typecheck；不越界到 command/auth/docs。
- code review / QA / acceptance 需要重点复核：filter request shape、pagination/truncated、summary 白名单、not-found error 和无副作用。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3.3 覆盖 S1-S9，每个核心场景有 step 与 evidence | none |
| DoD Contract | pass | E | design §3.4 与 checklist `dod.commands` 对齐，typecheck 是 core / fix-or-block | none |
| Steps and checks traceability | pass | E | checklist steps/checks 可解析且均为 pending，来源覆盖范围守护、名词契约、编排、流程、验收、挂载点 | none |
| Roadmap contract compliance | pass | E/C | design 绑定 roadmap item，核心 contract 对齐 roadmap §4.1；已补 not-found token、client seam、反本地过滤 | none |
| Module interface design | pass | E/C | design §2.1 已写 Interface 设计检查，并明确 createEcsClient seam 及类型非安全边界 | none |
| Validation and artifacts | pass | E | validation commands 与 required artifacts 已列出 | none |

Summary: E=5, C=1, H=0, H-only core checks=none。

## 6. Residual Risk

- `createEcsClient()` 暴露完整 SDK client 类型，不能作为只读权限边界；实现/审查必须继续靠 scope、tests 和 code review 保证本 feature 不调用 mutating API。
- `publicIpAddress` 与 `namePrefix` 的云端语义仍需实现期用 SDK 类型、mock 和必要实测校正；不可用时回传后续 command surface 调整，不做本地过滤伪装。

## 7. Verdict

- Status: passed
- Next: 交给用户整体 review；用户确认后可把 design 从 `draft` 改为 `approved`。
