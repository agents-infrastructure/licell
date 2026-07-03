---
doc_type: feature-qa
feature: 2026-07-03-ecs-readonly-provider
status: passed
tested: 2026-07-03
round: 1
---

# ecs-readonly-provider QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml`
- Review: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-review.md`
- Evidence pack: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-gate-results.json`
- DoD results: `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-dod-results.json`
- Diff basis: 未提交 diff；本 feature 可归因代码为 `src/providers/ecs.ts`、`src/providers/ecs/*`、`src/__tests__/ecs-provider.test.ts`。
- Baseline dirty files: `.codestable/` 中 roadmap goal 包和后续 feature design/checklist 均为本 goal 执行上下文；不计入本 feature 代码 QA 失败。
- Feature type: functional。
- Core evidence gate: provider 查询、过滤映射、分页、summary 白名单、detail/not-found、无副作用均由目标 unit tests 和 typecheck 覆盖；真实云账号不是本 feature 核心通过条件。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design S1/S2 | core-functional | 默认 region 和显式 region 创建 ECS endpoint 与 request region | unit/typecheck | `bun x vitest run src/__tests__/ecs-provider.test.ts` | endpoint 和 request region 正确 | pass |
| QA-002 | design S3 | core-functional | filters 映射到 `DescribeInstancesRequest`，且不做 post-filter | unit/typecheck | provider test | request shape 含 instanceIds/namePrefix/status/vpc/vsw/zone/type/charge/tag/IP，SDK 原样返回不匹配 row | pass |
| QA-003 | design S4 | core-functional | `name` 与 `namePrefix` 互斥 | unit | provider test | 抛含 `无效`/`invalid` 的 input error | pass |
| QA-004 | design S5 / review focus | core-functional | limit、truncated、多页、20 页上限、无 ID row 分页 | unit | provider test | 停止条件和 truncated 正确 | pass |
| QA-005 | design S6 | core-functional | summary 白名单和敏感字段排除 | unit/diff | provider test + grep | 数组默认 `[]`，tag 归一化，敏感字段不出现在结果 | pass |
| QA-006 | design S7/S8 | core-functional | detail found 和 not-found 分类 token | unit | provider test | found 返回 `{ summary }`；空结果可被 `isNotFoundError` 识别 | pass |
| QA-007 | design S9 / scope | core-functional | 无副作用、无 mutating ECS API、无 command/auth/docs 漂移 | diff/grep/scope-gate | scope-gate + grep | 无 lifecycle API 调用，不写项目状态 | pass |
| QA-008 | DoD | supporting | 必跑命令 | command | `bun run typecheck`; provider test; YAML 校验 | exit 0 | pass |

## 3. Command Results

- `bun run typecheck` → exit 0：TypeScript 编译检查通过。
- `bun x vitest run src/__tests__/ecs-provider.test.ts` → exit 0：1 file passed，9 tests passed。
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only` → exit 0：1 file passed。
- `python3 .codestable/tools/codestable-scope-gate.py ...` → exit 0：scope-gate passed。
- `python3 .codestable/tools/codestable-dod-runner.py ...` → exit 0：DoD runner passed。

## 4. Scenario Results

- [x] QA-001 默认/显式 region：pass。
  - Evidence: provider test 校验 `ecs.cn-shanghai.aliyuncs.com` 与默认 `ecs.cn-hangzhou.aliyuncs.com`。
- [x] QA-002 filter 映射与无 post-filter：pass。
  - Evidence: request capture 覆盖 instanceIds/namePrefix/status/vpc/vsw/zone/type/charge/tag/private/public/eip；mock 返回不匹配 filter 的 `i-unmatched` 仍原样出现在结果。
- [x] QA-003 name 互斥：pass。
  - Evidence: provider test 断言错误消息匹配 `/无效|invalid/i`。
- [x] QA-004 分页与截断：pass。
  - Evidence: provider test 覆盖多页、limit 小于 totalCount、20 页上限、raw rows 与 normalized count 分离。
- [x] QA-005 summary 白名单：pass。
  - Evidence: provider test 将 `userData/password/vncUrl/keyPairPrivateKey` 放入 SDK row fixture，并断言 JSON result 不包含这些字段。
- [x] QA-006 detail/not-found：pass。
  - Evidence: provider test 断言 `getEcsInstanceDetail` 使用 `instanceIds` 查询，空结果 message 包含 `not exist` 且 `isNotFoundError` 为 true。
- [x] QA-007 无副作用：pass。
  - Evidence: scope-gate 只允许 provider/test/feature 目录；grep 生产代码无 lifecycle mutating API。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- 真实 ECS 云端对 `instanceName=prefix*`、tag AND、private/public/eip IP filters 的语义未用真实账号验证。design 和 goal-plan 已说明本 feature 核心路径使用 mock/contract tests，真实只读 smoke 不是本 feature 阻塞条件；后续 command/filter contract feature 继续承接。

## 6. Cleanliness

- Debug output: pass。
- Temporary TODO/FIXME/XXX: pass。
- Commented-out code: pass。
- Unused imports / dead code from this feature: pass，由 `bun run typecheck` 覆盖。
- Out-of-scope files: pass，scope-gate 本 feature 范围通过。
- 说明：敏感词 grep 命中仅在测试 fixture 中，用于验证白名单不泄漏，不是生产代码泄漏。

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段。
