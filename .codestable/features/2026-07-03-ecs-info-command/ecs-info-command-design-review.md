---
doc_type: feature-design-review
feature: 2026-07-03-ecs-info-command
status: passed
reviewed: 2026-07-03
round: 1
---

# ecs-info-command feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, `ecs-readonly-provider` / `ecs-auth-read-permissions` / `ecs-list-command` design 与 review
- Code facts checked: `src/utils/output.ts`, `src/utils/alicloud-error.ts`, `src/utils/cli-shared.ts`, `src/commands/db.ts`, `src/commands/module.ts`, `src/utils/command-metadata.ts`, `src/__tests__/cli-help-json-contract.test.ts`, command registry / manifest / surface metadata tests

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `0d762536-a192-479c-89a3-e045a3970ff8`
- Raw output: 独立审查判定 passed，无 blocking；提出 3 条 important：items.yaml 依赖漏 `ecs-list-command`，not-found message 插值可能被 input token 抢先分类，S5 的 region nextAction 期望当前无 output guidance 通道。
- Merge policy: 已逐条核验并收口。items.yaml 已补依赖；design/checklist 已放宽 S5 为只硬断言 `category=not_found`，并记录干净 ID 测试要求；`.codestable/attention.md` 已沉淀 output 分类顺序陷阱。
- Gate effect: none

## 2. Design Summary

- Goal: 新增 `licell ecs info <instanceId>`，按当前或显式 region 查询单台 ECS 基础详情。
- Key contracts: 复用 ECS command module；调用 `getEcsInstanceDetail(instanceId, { regionId })`；默认不跨 region；JSON payload 为 `{ regionId, instanceId, detail }`；not-found 归 `not_found`；输出只含白名单字段。
- Steps: 5 步，风险热点是复用 list module、not-found 分类、敏感字段白名单、help/catalog metadata 和无副作用。
- Checks: 覆盖 provider/auth scope guard、region 语义、not-found、whitelist、help JSON、无副作用和不注册 lifecycle。
- Baseline / validation: typecheck、`ecs-command.test.ts`、registry/manifest/surface metadata tests、help JSON contract、YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 `items.yaml` 依赖漏掉 `ecs-list-command`：已补 `depends_on`，避免 info 在 list module 未落地前被调度。
- FDR-002 not-found message 插入用户 ID 可能触发 input token 抢先分类：已在 design/checklist 要求测试使用干净 `i-xxx` ID，并写入 attention。
- FDR-003 S5 要求 nextAction 提示 region 但当前 output guidance 没有 not_found 分支：已放宽为只硬断言 category=`not_found`，region 引导降级为文案或后续 docs 期望。

### nit

none

### suggestion

- 顶层 `regionId` 应反映 provider 实际查询 region，即来自 `detail.summary.regionId`，而不是未传 `--region` 时回显 `undefined`；实现期按 checklist 的 JSON payload 断言复核。

### learning

- Licell CLI JSON error 分类中 input token 优先于 provider 语义分类。任何把用户输入插入 error message 的 not-found/conflict 文案，都要考虑 token 抢先命中风险。

### praise

- scope guard 干净：只追加 `ecs info`，不碰 provider/auth/docs，不注册 lifecycle。
- input token 与 `toPromptValue()` / `output.ts` 分类器对齐，空 instanceId 能稳定归 input。
- 白名单与敏感字段负向断言方向正确，help JSON metadata seam 可执行。

## 4. User Review Focus

- 用户需要重点拍板：`ecs info` 第一版默认只查当前 region，不自动跨 region 搜索。
- implement 需要重点遵守：复用 list 创建的 ECS module；not-found 不包裹改写；JSON/text 不泄漏敏感字段。
- code review / QA / acceptance 需要重点复核：`items.yaml` 依赖图、not-found category、region payload、help JSON result fields。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 覆盖 registry、region、input、not-found、auth、whitelist、help JSON、no side effects | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、command tests、manifest/metadata tests、help JSON contract、YAML 校验 | none |
| Steps and checks traceability | pass | E | steps/checks 可解析，review findings 已回写关键 exit signal/check | none |
| Roadmap contract compliance | pass | E/C | roadmap §4.2 的当前 region、not-found、白名单、无副作用已落地；items.yaml 已补 list 依赖 | none |
| Module interface design | pass | E/C | design 明确复用 ECS CLI module 和 provider detail seam | none |
| Validation and artifacts | pass | E | 必跑命令与后续 review/QA/acceptance artifacts 已列出 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- 若未来要让 not-found 自动给出 `--region` nextAction，需要扩展 provider error details 或 output guidance；当前 feature 不做。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；等待所有 child feature design-review 通过后统一给用户确认。
