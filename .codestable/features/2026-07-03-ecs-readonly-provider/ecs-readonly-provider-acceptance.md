---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-readonly-provider
status: passed
accepted: 2026-07-03
round: 1
---

# ecs-readonly-provider 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-03
> 关联方案 doc：`.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：

- [x] `createEcsClient('cn-shanghai')`：代码位于 `src/providers/ecs/client.ts`，返回 `{ regionId, client }`，endpoint 为 `ecs.cn-shanghai.aliyuncs.com`。provider test 已验证显式 region 和 auth 默认 region。
- [x] `listEcsInstances({ regionId, limit, namePrefix, tags })`：代码位于 `src/providers/ecs/query.ts`，返回 `{ regionId, filters, totalCount, count, limit, truncated, instances }`。provider test 已验证 request shape、分页和 summary。
- [x] `getEcsInstanceDetail('i-xxx', { regionId })`：代码位于 `src/providers/ecs/query.ts`，通过 `instanceIds` 查询并返回 `{ summary }`；空结果抛 `ECS instance not exist: ...`。

**名词层"现状 → 变化"逐项核对**：

- [x] ECS Provider：新增 `src/providers/ecs/` 和 `src/providers/ecs.ts` facade，没有复用 `infra` 命名。
- [x] `EcsInstanceSummary`：新增稳定白名单类型，CLI 后续可依赖该 domain type，不依赖 SDK raw response。
- [x] provider filter：全部映射进 `DescribeInstancesRequest`，测试证明无分页后本地过滤。

**流程图核对**：

- [x] future caller → provider seam：`src/providers/ecs.ts` 暴露 `listEcsInstances` / `getEcsInstanceDetail`。
- [x] resolve region → create client：`createEcsClient(filters.regionId)` 使用显式 region 或 `Config.requireAuth().region`。
- [x] build request → describeInstances loop → normalize summary：`src/providers/ecs/query.ts` 已实现。
- [x] detail empty → not-found：`getEcsInstanceDetail` 已实现并测试。

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] `createEcsClient(regionId?)`：显式 region 和默认 auth region 均有 test 证据。
- [x] `listEcsInstances(options)`：filter、分页、truncated、summary normalization 均有 test 证据。
- [x] `getEcsInstanceDetail(instanceId, options)`：found、empty result not-found、空 ID input error 均有 test 证据。
- [x] provider 不泄漏 SDK raw response，不返回敏感字段：summary 类型和 fixture 负向测试覆盖。

**明确不做逐项核对**：

- [x] 未注册 `licell ecs` 命令，未修改 command registry/help/catalog/docs。
- [x] 未新增 `AuthCapability='ecs'`、RAM policy action 或 doctor probe。
- [x] 未调用 lifecycle mutating ECS API、Cloud Assistant、VNC、userData/password/key pair 私钥相关 API。
- [x] 未写 `.licell/project.json`、`.licell/state.json` 或 workspace component 配置。

**关键决策落地**：

- [x] 新增 `src/providers/ecs/` + facade：已落地。
- [x] SDK 字段经 typecheck 校正：`bun run typecheck` 通过；SDK request tag 字段核验为 `key/value`。
- [x] 过滤只走服务端字段：request builder 使用 ECS SDK request 字段；无 post-filter。
- [x] 详情存在性以 `DescribeInstances(instanceIds=[id])` 为准：已落地。
- [x] 敏感字段白名单优先：已落地并测试。

**挂载点反向核对**：

- [x] `src/providers/ecs.ts` facade 是后续 command/doctor 的唯一 provider public surface。
- [x] `src/providers/ecs/types.ts` public exports 包含 design 约定类型。
- [x] grep 当前代码，仅测试导入新 facade；没有额外隐藏挂载点。
- [x] 拔除沙盘推演：删除 `src/providers/ecs.ts`、`src/providers/ecs/`、`src/__tests__/ecs-provider.test.ts` 即可移除本 feature 代码能力，不影响现有 VPC/RDS/Redis provider。

## 3. 验收场景核对

- [x] S1 默认 region list：provider test 验证默认 `cn-hangzhou` endpoint 和 request region。
- [x] S2 显式 region list：provider test 验证 `cn-shanghai` endpoint 和 request region。
- [x] S3 filter 映射：provider test 覆盖 instanceIds/namePrefix/status/vpc/vsw/zone/instanceType/charge/tag/private/public/eip request shape，并验证无 post-filter。
- [x] S4 name 互斥：provider test 断言 input error。
- [x] S5 分页上限：provider test 覆盖多页、limit 截断、20 页上限、raw rows 与 normalized count 分离。
- [x] S6 摘要白名单：provider test 验证数组默认 `[]`、tag 归一化、敏感字段不泄漏。
- [x] S7 detail found：provider test 验证 instanceIds 查询和 `{ summary }`。
- [x] S8 detail not found：provider test 验证 `not exist` token 和 `isNotFoundError`。
- [x] S9 无副作用：scope-gate 和 grep 复核通过。

**review 报告重点复核**：

- [x] REV-001 分页 raw-row finding 已修复并补测。
- [x] Tag request 字段疑点经 SDK 类型核验为误报。
- [x] QA focus 均纳入 QA 报告 residual risk 或测试矩阵。

**QA 报告重点复核**：

- [x] 验证证据来源：`.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-qa.md`
- [x] QA 报告覆盖 design 关键场景和 review QA focus。
- [x] Feature type 判定为 functional，核心路径均有 unit/typecheck/diff 运行证据。
- [x] failed / blocked 项为 none。
- [x] residual-risk 未承载核心验收缺口。
- [x] Evidence pack、DoD Results、Gate Results 已复核；blocking DoD 均有 pass evidence。

## 4. 术语一致性

- ECS Provider：代码路径和 facade 命名一致。
- `EcsClientContext` / `EcsInstanceFilters` / `EcsListInstancesOptions` / `EcsInstanceSummary` / `EcsListInstancesResult` / `EcsInstanceDetail`：代码命名与 design 第 2.1 节一致。
- provider filter：代码中未新增 design 外公开术语。
- 防冲突：未复用 `infra` provider 命名承载 ECS。

## 5. 领域影响盘点

- 新名词候选：ECS Provider、`EcsInstanceSummary`。本 feature 只新增内部 provider 契约，不改变外部 CLI surface；暂不需要写 CONTEXT.md。
- 结构性选择候选：新增 `src/providers/ecs/` 而不抽共享 ECS client factory。design 已说明这是局部实现选择，尚未形成难回退架构决策；暂不需要 ADR。
- 流程级约束候选：ECS request tag 使用 `key/value`、response tag 使用 `tagKey/tagValue`。这对后续 ECS feature 有复用价值，建议在 goal 后统一沉淀到 attention 或 compound。

## 6. requirement delta / clarification 回写

- Design frontmatter 无 `requirement` 字段。
- 本 feature 是 roadmap 子 feature 内部 provider 能力，未新增用户可见 CLI 行为。
- 结论：无 requirement 影响，不回写 requirements。

## 7. roadmap 回写

- [x] `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml` 中 `ecs-readonly-provider` 已从 `in-progress` 改为 `done`。
- [x] `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md` 第 5 节对应条目已同步为 `状态：done`、`对应 feature：2026-07-03-ecs-readonly-provider`。
- [x] YAML 校验在最终审计中复跑。

## 8. attention.md 候选盘点

- 候选 1：ECS SDK `DescribeInstancesRequestTag` 使用 `key/value`，response tag 使用 `tagKey/tagValue`。后续 ECS feature 可能复用，建议 goal 完成后统一沉淀。
- 候选 2：scope-gate 在整个 `.codestable/` 未跟踪时会把某些路径解析成截断项；本轮通过 `--check-path` 限定 feature scope。若后续反复遇到，建议补入 attention 的命令陷阱。

## 9. 遗留

- 后续优化点：若后续更多 ECS feature 复用 client 构造，可另起 refactor 评估与 `src/providers/vpc.ts` 的 ECS client factory 统一。
- 已知限制：真实 ECS 云端过滤语义未在本地 mock 中完全证明，后续 `ecs-filter-contract-tests` 和命令 feature 继续承接。
- 实现阶段顺手发现：none。

## 10. 最终审计

- 验证证据来源：`ecs-readonly-provider-qa.md`
- Evidence sources：`ecs-readonly-provider-evidence-pack.md` / `ecs-readonly-provider-dod-results.json` / `ecs-readonly-provider-gate-results.json`
- 聚合命令：
  - `bun run typecheck` → exit 0
  - `bun x vitest run src/__tests__/ecs-provider.test.ts` → exit 0，9 tests passed
  - `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only` → exit 0
  - `python3 .codestable/tools/validate-yaml.py --file .codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml --yaml-only` → exit 0
- 场景复核：re-verified 9 / trust-prior-verify 0
- 交付物复核：provider facade/types/client/query、provider tests、review、QA、acceptance、roadmap item 回写均已落盘。
- 完整工作区复核：git status 包含本 goal 未跟踪 `.codestable/` 包和本 feature 新增代码；feature 1 可归因文件已纳入 scope-gate。
- diff 清洁度：生产代码无 debug 输出、TODO/FIXME/XXX、注释掉代码、mutating API；测试 fixture 中敏感字段用于白名单负向验证。
- 知识沉淀出口：attention/compound 候选已记录在第 8 节；goal 完成后统一处理。
- 结论：通过。
