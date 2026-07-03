---
doc_type: feature-review
feature: 2026-07-03-ecs-readonly-provider
status: passed
reviewer: subagent
reviewed: 2026-07-03
round: 1
---

# ecs-readonly-provider 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-dod-results.json`
- Implementation evidence: checklist steps 全 done；DoD runner 通过 `bun run typecheck`、`bun x vitest run src/__tests__/ecs-provider.test.ts`、checklist YAML 校验。
- Diff basis: 当前未提交 diff，scope-gate 限定本 feature 目录、`src/providers/ecs.ts`、`src/providers/ecs/`、`src/__tests__/ecs-provider.test.ts`。
- Baseline dirty files: `.codestable/` roadmap/design/gate 产物为 goal 执行上下文；审查结论只覆盖本 feature 可归因代码和 feature 1 证据产物。

### Independent Review

- Detection: Paseo subagent 可用；OCR CLI 可用且 `ocr llm test` 成功。
- 环节 A 独立隔离 Task agent: paseo completed，agent `17fadcec-b7fa-44ce-91be-2d1a570d48cd`，provider `claude/opus`。
- 环节 B OCR CLI: skipped-scope-ambiguous；`ocr review --preview` 会审 51 个文件，包含大量 `.codestable/tools` 和其他 feature checklist，且目标测试文件被默认规则排除，不满足本轮 scope 约束。
- OCR severity mapping: 未合并 OCR finding；原因是未启动正式 OCR review。
- Merge policy: Paseo findings 已逐条本地核验。分页 raw-row finding 已修复并补测；tag request 字段疑点经 SDK 类型核验为误报。
- Gate effect: none。

## 2. Diff Summary

- 新增：`src/providers/ecs.ts`、`src/providers/ecs/client.ts`、`src/providers/ecs/query.ts`、`src/providers/ecs/types.ts`、`src/__tests__/ecs-provider.test.ts`
- 修改：`.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`
- 删除：none
- 未跟踪 / staged：当前所有本轮实现文件均未跟踪；无 staged diff。
- 风险热点：Alibaba Cloud ECS SDK request/response 字段、分页截断、过滤不做本地伪装、not-found/input 错误分类。

## 3. Adversarial Pass

- 假设的生产 bug：ECS provider 看似按云端总数停止分页，但跳过无 `instanceId` 行后误用 normalized count，导致多发请求或截断判断错误。
- 主动攻击过的反例：无 ID row、limit 小于 totalCount、20 页上限、name/namePrefix 互斥、tag/IP/namePrefix request shape、敏感字段泄漏、not-found 分类。
- 结果：分页 raw-row 反例已升级为实现修复并补 `uses raw rows rather than normalized count when comparing totalCount` 测试；20 页上限补测。其余反例由现有测试和 typecheck 覆盖。

## 4. Findings

### blocking

none

### important

none

已处理：

- [x] REV-001 `src/providers/ecs/query.ts:156` 分页停止条件不应使用 normalized `instances.length` 与云端 `totalCount` 比较。
  - Evidence: 独立 reviewer 指出无 `instanceId` row 被跳过时可能误判；本地核验成立。
  - Fix: 新增 `rawRowsSeen`，用原始 row 数与 `totalCount` 比较，并用原始 row 数计算 `truncated`。
  - Verification: `bun x vitest run src/__tests__/ecs-provider.test.ts` 9 tests passed；`bun run typecheck` passed。

已核验为误报：

- REV-002 `src/providers/ecs/query.ts:100` Tag request 字段是否应为 `tagKey/tagValue`。
  - Evidence: `node_modules/@alicloud/ecs20140526/src/client.ts` 中 `DescribeInstancesRequestTag` 明确定义 `key?: string`、`value?: string`，`names()` 映射到 API `Key` / `Value`；response tag 才是 `tagKey` / `tagValue`。
  - Verdict: 实现使用 `{ key, value }` 正确；保留到 QA focus 复核 SDK 类型证据，不作为 finding。

### nit

none

### suggestion

- 后续如果更多 ECS provider 复用 client 构造，可另起 refactor 评估与 `src/providers/vpc.ts` 的 ECS client factory 统一；本 feature 按 design 保持独立，不修改 VPC 行为。

### learning

- ECS SDK request tag 使用 `key/value`，response tag 使用 `tagKey/tagValue`，实现和测试需要明确区分。
- 分页终止条件涉及 normalized output 时，应避免把过滤后的数量与云端 `totalCount` 直接比较。

### praise

- provider 没有引入 command/auth/docs 行为，也没有调用 lifecycle mutating API。
- tests 覆盖了 request shape、无 post-filter、summary 白名单、not-found/input token、20 页上限和 raw-row totalCount 边界。

## 5. Test And QA Focus

- QA 必须重点复核：`bun run typecheck`、`bun x vitest run src/__tests__/ecs-provider.test.ts`、checklist YAML 校验。
- Evidence pack residual risks / gate warnings：evidence pack residual risk 为 none；provider signal 中 archguard 可用但未采集风险摘要、meta-cc unavailable，均不影响核心 provider 行为判断。
- 建议新增或加强的测试：none，本轮 review 后已补 20 页上限与无 ID row 分页测试。
- 不能靠 review 完全确认的点：真实云端对 `instanceName=prefix*`、IP filters、tag filters 的语义仍需后续 command/contract QA 或真实 smoke 验证；当前 feature 的核心通过条件是 SDK 类型与 mock request contract，不要求真实云账号。

## 6. Residual Risk

- 真实 ECS 云端过滤语义无法在本地 mock 中完全证明，尤其是 `namePrefix`、public/private/eip IP filters 与 tag AND 语义。该风险已由 design 定义为后续 command surface / contract tests 继续处理，不是本 provider feature 的 blocking 缺口。

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` QA 阶段。
