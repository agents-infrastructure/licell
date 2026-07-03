---
doc_type: feature-design-review
feature: 2026-07-03-ecs-command-surface-docs
status: passed
reviewed: 2026-07-03
round: 1
---

# ecs-command-surface-docs feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-command-surface-docs/ecs-command-surface-docs-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, 前置 `ecs-list-command` / `ecs-info-command` / `ecs-auth-read-permissions` design 与 review
- Code facts checked: `scripts/sync-docs.ts`, `scripts/check-docs.ts`, `src/utils/docs-pipeline.ts`, `src/utils/readme-docs.ts`, `src/utils/agent-surface-docs.ts`, `src/utils/command-reference.ts`, `src/utils/command-reference-sections.ts`, `src/utils/skills-scaffold.ts`, `src/utils/shell-completion.ts`, docs/surface/skill/completion tests

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `913211fd-9947-4613-b5b6-c3826bb45c9d`
- Raw output: 独立审查判定无 blocking；提出 3 条 important：`src/commands/ecs.ts` descriptor 所有权不应归 docs feature，committed `.claude/skills/licell/SKILL.md` 缺自动 drift guard，`renderSkillCommandReference()` 是 test-only surface 不能和 agent-facing skill 混淆。
- Merge policy: 已逐条核验并收口。design/checklist 已把 `src/commands/ecs.ts` 改为只读依赖，metadata 缺失回 `ecs-list-command` / `ecs-info-command`；Step 2 增加 committed SKILL.md 与 `getSkillFiles('claude')[0].content` 一致性测试；`renderSkillCommandReference()` 已标注为 test-only renderer；同时补充 `AGENTS_MD_LICELL_ENTRY` 与 `getSkillContent()` 两处描述同步、section 顺序只复验、catalog 示例补全。
- Gate effect: none

## 2. Design Summary

- Goal: 同步 ECS 查询命令的 metadata、generated docs、agent surface、skill scaffold 与 shell completion，证明 Agent 可按 `catalog -> help -> --output json` 发现 ECS 查询。
- Key contracts: registry/descriptor 是唯一命令事实源；README/agent surface 由 docs sync 生成；agent-facing skill 只声明 ECS queries 与操作合同，不内嵌命令表；completion 从 command catalog 派生。
- Steps: 5 步，风险热点是 descriptor 所有权、generated docs 漂移、skill scaffold/committed skill 分叉、section 顺序和 lifecycle 半命令泄漏。
- Checks: 覆盖 catalog/help JSON、section order、README/agent surface sync、skill scaffold drift guard、completion candidates、lifecycle guard 和无行为漂移。
- Baseline / validation: typecheck、command/reference/docs/skill/completion tests、docs:sync、docs:check、YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 `src/commands/ecs.ts` descriptor 被列为可写挂载点，与 list/info feature 形成双重所有权：已改为只读依赖；缺 metadata 时回前置 feature 修复。
- FDR-002 committed `.claude/skills/licell/SKILL.md` 不在 docs sync/check 覆盖内，缺 drift guard：已要求 `skills-scaffold.test.ts` 断言 committed skill 等于 `getSkillFiles('claude')[0].content`。
- FDR-003 `renderSkillCommandReference()` 是 test-only renderer，不能等同 agent-facing skill：已明确 agent-facing skill 只通过 description + catalog/help 合同体现 ECS queries，命令表 renderer 只作为测试 surface guard。

### nit

已处理：

- `skills-scaffold.ts` 的 `getSkillContent()` description 与 `AGENTS_MD_LICELL_ENTRY` 两处文案均已纳入 checklist。
- section 顺序已明确由 `ecs-list-command` 的 registry 插入点保证，本 feature 只在 docs/surface 层复验。
- catalog JSON 示例已补齐 `regionId/count/limit/totalCount/truncated/filters/instances[]`，避免按节选误实现。
- completion 关键 options 已扩展到 `--region`、`--limit`、`--tag`、`--name-prefix`、`--private-ip`、`--public-ip`、`--eip`。

### suggestion

none

### learning

- Committed skill 文件不在 docs pipeline target 内，凡是改 scaffold 文案都需要显式 drift test 或手动同步验证。
- Registry-derived “skill command reference” 与实际 agent-facing skill 是两个不同 surface；review/QA 必须找对验证对象。

### praise

- 设计坚持 registry 单一事实源，README/agent surface/generated docs 不手写命令表。
- lifecycle guard 覆盖 catalog/help/docs/test-only skill command reference/completion，能防止半命令泄漏到 agent surface。
- README 手写区与 generated block 边界清楚，允许顶层能力 bullet 但不复制生成命令表。

## 4. User Review Focus

- 用户需要重点拍板：ECS 查询要进入 README 顶部能力概览和 skill description，但实际命令发现仍以 catalog/help 为准。
- implement 需要重点遵守：不要在 docs feature 内补 `ecs.ts` descriptor；先修前置 list/info metadata，再运行 docs sync/check。
- code review / QA / acceptance 需要重点复核：committed skill 与 scaffold 不分叉、section order data → infra → automation、generated docs 无手改、lifecycle 半命令不出现。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 覆盖 catalog/help、section order、generated docs、skill scaffold、completion、lifecycle guard、scope guard | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、surface/docs/skill/completion tests、docs:sync/check、YAML 校验 | none |
| Steps and checks traceability | pass | E | steps/checks 可解析，review findings 已回写到 Step 1/2/4 与 checks | none |
| Roadmap contract compliance | pass | E/C | roadmap §4.4 的 generated docs、catalog/help、INFRA section、docs sync/check 已落地；descriptor 所有权回前置 feature | none |
| Module interface design | pass | E/C | design 明确 docs/skill/completion seams，agent-facing skill 与 test-only renderer 已区分 | none |
| Validation and artifacts | pass | E | 必跑命令与后续 review/QA/acceptance artifacts 已列出，YAML 已通过校验 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- 前置 `ecs-list-command` / `ecs-info-command` 尚未实现时，本 feature 的 surface 验证无对象可测；design/checklist 已把这作为 Step 1 前置 gate。
- Committed skill 与 scaffold 的一致性需要实现期新增测试后才真正机器守护；当前 design 已要求但尚未实现。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；等待所有 child feature design-review 通过后统一给用户确认。
