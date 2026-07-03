---
doc_type: feature-design-review
feature: 2026-07-03-ecs-lifecycle-command-scaffold
status: passed
reviewed: 2026-07-03
round: 1
---

# ecs-lifecycle-command-scaffold feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold/ecs-lifecycle-command-scaffold-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, 前置 `ecs-auth-read-permissions` / `ecs-filter-contract-tests` / `ecs-command-surface-docs` design 与 review
- Code facts checked: `src/commands/module.ts`, `src/utils/command-semantics.ts`, `src/utils/cli-shared.ts`, `src/utils/command-surface-metadata.ts`, `src/commands/task.ts`, command surface/auth/RAM tests

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `20f5ca73-7832-4e58-97a9-ca402abecd08`
- Raw output: 独立审查判定无 blocking；提出 2 条 important：design 把 epic auth 目标态误写成当前态且依赖时序不够显式，确认 helper 文案与 confirmFlags 自动收集两处 caveat 未强制进入 seed 交付物。另指出 safety 类型路径、stop 当前推断为 destructive 的措辞偏差，以及 auth guard 可从黑名单加强为只读白名单。
- Merge policy: 已逐条核验并收口。design/checklist 已改为：`AuthCapability='ecs'` 只读动作是 `ecs-auth-read-permissions` 提供的目标态；实现前置必须等前置 siblings surface 可验证；seed 必须写入删除语义确认 helper caveat 与 confirmFlags 自动收集边界；`CommandSafetyMetadata` 类型路径改为 `src/commands/module.ts`；stop 风险描述改为“只依赖自动推断且缺 interruption 专属确认/文案”；auth guard 收紧为 `CAPABILITY_ACTIONS.ecs` 等于只读 Describe 白名单，policy 继续断言不含 mutating 黑名单。
- Gate effect: none

## 2. Design Summary

- Goal: 为后续 ECS start/stop/reboot/rm/delete/run 等操控命令沉淀安全 seed 和负向 guard，但当前不开放任何 mutating behavior。
- Key contracts: 当前 ECS epic 只读；未来 lifecycle feature 必须另起 design，显式 safety metadata、dry-run、precheck、confirm、RAM action、verify；当前 command surface/auth/RAM 不得提前暴露半命令或扩权。
- Steps: 5 步，风险热点是 seed 被误当当前用户指南、lifecycle 半命令泄漏到 catalog/help/docs/completion、以及 `ecs` capability/policy 提前加入 mutating action。
- Checks: 覆盖不注册 lifecycle command、不新增 provider wrapper、不改 doctor probe、不扩只读 action list、seed 内容完整、surface/auth/RAM 负向 guard 和无 generated docs 手改。
- Baseline / validation: typecheck、command reference/manifest/surface/help/completion tests、auth/RAM tests、YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 design “现状”将 epic auth 目标态写成当前代码事实，且 checklist 未把前置 sibling 落地作为 guard：已改为目标态由 `ecs-auth-read-permissions` 提供，并在 design/checklist 增加实现前置。
- FDR-002 确认 helper 删除语义与 confirmFlags 自动收集边界只留在 design，没有强制进入 seed 交付物：已要求 seed 明确 stop/reboot 不复用删除文案，新增确认 flag 需同步 surface metadata 或显式 descriptor。

### nit

已处理：

- `CommandSafetyLevel` / `CommandSafetyMetadata` 定义路径已更正为 `src/commands/module.ts`。
- stop 的风险措辞已从“可能只按 mutating 处理”改为“当前会自动推断为 destructive，但缺 interruption 专属确认/文案”。

### suggestion

已处理：

- Step 3 的 auth guard 已从单纯黑名单增强为 `CAPABILITY_ACTIONS.ecs` 等于 `ecs:DescribeInstances` / `ecs:DescribeInstanceAttribute` 只读白名单，同时保留 RAM policy mutating 黑名单断言。

### learning

- `ensureDestructiveActionConfirmed()` 是删除语义 helper；把它用于 stop/reboot 会产生错误 UX，后续高影响非删除命令需要通用确认 helper 或命令专属文案。
- `confirmFlags` 自动发现只收 `--yes` / `--apply` / `--force`；新增确认 flag 不是天然 agent-facing，需要同步 metadata 规则或显式 descriptor。

### praise

- 设计坚持“不开放半命令”：seed 写在 roadmap 目录，runtime command/provider/auth 不提前实现。
- stop 被单独按业务中断风险处理，避免把非删除但高影响的 ECS 操作降成普通 mutating。
- lifecycle seed 的 phase split、dry-run、precheck、verify、RAM action 表能直接给后续 `cs-feat` 消费。

## 4. User Review Focus

- 用户需要重点拍板：当前 epic 是否只到 ECS read-only query + lifecycle seed，不开放任何 start/stop/reboot/delete/run 行为。
- implement 需要重点遵守：seed 是后续 feature 输入，不是用户文档；当前不得注册 lifecycle command、不得新增 ECS mutating provider wrapper、不得扩 `CAPABILITY_ACTIONS.ecs`。
- code review / QA / acceptance 需要重点复核：catalog/help/docs/completion 不出现 lifecycle 半命令，`CAPABILITY_ACTIONS.ecs` 仍等于只读白名单，RAM policy 不含 mutating ECS lifecycle action。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 覆盖 seed、command surface guard、auth/RAM guard、future safety contract、no production behavior | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、surface tests、help/completion tests、auth/RAM tests、YAML 校验 | none |
| Steps and checks traceability | pass | E | steps/checks 可解析，review findings 已回写 Step 1/3 与 checks | none |
| Roadmap contract compliance | pass | E/C | roadmap 要求预留 lifecycle 安全设计但不开放 mutating 行为；design 明确只写 seed 与 guard | none |
| Module interface design | pass | E/C | design 明确本 feature 不新增 runtime module，seam 是 catalog/help/completion 与 auth/RAM action lists | none |
| Validation and artifacts | pass | E | 必跑命令、seed/review/QA/acceptance artifacts 与清洁度规则已列出，YAML 已通过校验 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- 本 feature 必须排在 `ecs-auth-read-permissions`、`ecs-filter-contract-tests`、`ecs-command-surface-docs` 实现之后；否则 list/info surface 或 `CAPABILITY_ACTIONS.ecs` 还不存在，guard 无法证明目标态。
- 负向 guard 只能证明“当前没有误暴露/误扩权”，不能替代未来 lifecycle feature 自己的 design-review、code review 和 QA。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；所有 child feature design-review 已通过后，等待用户统一确认 designs。
