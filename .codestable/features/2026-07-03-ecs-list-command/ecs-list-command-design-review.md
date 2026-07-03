---
doc_type: feature-design-review
feature: 2026-07-03-ecs-list-command
status: passed
reviewed: 2026-07-03
round: 1
---

# ecs-list-command feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`, `.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`
- Code facts checked: `src/commands/db.ts`, `src/commands/cache.ts`, `src/commands/sections.ts`, `src/commands/registry.ts`, `src/commands/module.ts`, `src/utils/command-metadata.ts`, `src/utils/command-reference-sections.ts`, `src/utils/cli-shared.ts`, `src/utils/output.ts`, `src/__tests__/command-surface-metadata.test.ts`, `src/__tests__/help.test.ts`

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `7f006bdb-031b-48ed-b7f4-6dd81ecce216`
- Raw output: 独立审查判定 PASS，无 blocking；提出 1 条 important：registry module 插入位置未指定会静默违反 roadmap section 排序契约。
- Merge policy: 已逐条核验。I1 已修入 design/checklist：`ecsCommandModule` 必须插在 `supaCommandModule` 后、`doctorCommandModule` 前，并新增 section order assertion；suggestion 中 descriptor 不含未注册命令也已加入 checklist。
- Gate effect: none

## 2. Design Summary

- Goal: 新增 `licell ecs list`，把 ECS provider list 查询暴露为人类文本输出和 `@@LICELL_JSON@@` result payload。
- Key contracts: 新增 `INFRA_SECTION / Cloud Infrastructure`、`ecs` command module、`ecs list` command；命令层 parse filters，调用 `listEcsInstances(options)`，通过 `requiredCapabilities: ['ecs']` 接 auth recovery。
- Steps: 5 步，风险热点是 registry/section 顺序、repeatable tag parse、filter mapping、JSON/help metadata、无副作用和不注册半成品命令。
- Checks: 覆盖 provider/auth scope guard、section/registry、limit 20/200、status 透传、tag/name/IP filters、auth capability、help JSON 和 no-side-effect。
- Baseline / validation: `bun run typecheck`、`ecs-command.test.ts`、manifest/help metadata tests、cli help JSON contract、checklist YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 registry 模块插入位置未指定，可能让 `INFRA_SECTION` 在 generated surface 中排到 Automation 之后：已在 design §2.3、§2.4、§3 和 checklist Step 1/checks 中固定插入位置与 section 顺序断言。

### nit

- N1 help JSON 中 `safe` safety 的可见性需要实现期断言：已由 Step 4 / checklist 中 `ecs list --help --output json` 暴露 safe safety 的检查覆盖。
- N2 文本空态/列表输出只在 Step 3 exit signal 中出现：保留现状，已足够支撑实现与 QA。

### suggestion

- namespace descriptor 的 examples / recommendedFlow 不应包含未注册的 `ecs info` 或 lifecycle 命令：已补入 checklist 范围守护。

### learning

- section 顺序不是由 section 常量决定，而是由 `LICELL_COMMAND_MANIFEST.modules` 首次出现顺序驱动；新增跨 section 模块时必须显式指定 registry 插入点并测试。

### praise

- scope guard 清楚：只注册 `ecs list`，不越界到 provider/auth/docs/info/lifecycle。
- input error token 与 `output.ts` 分类关键词逐字对齐，降低 CLI JSON error category 漂移风险。
- JSON payload 直接使用 provider result，避免命令层重复整形导致字段漂移。

## 4. User Review Focus

- 用户需要重点拍板：`ecs list` 第一版只做 inspect / safe 查询，不注册 `ecs info` 或生命周期半成品命令。
- implement 需要重点遵守：`ecsCommandModule` registry 插入位置、repeatable `--tag` runtime shape、filter parse 不做 post-filter、`requiredCapabilities: ['ecs']`。
- code review / QA / acceptance 需要重点复核：catalog/help JSON 能发现 `ecs list`，section 顺序 data → infra → automation，descriptor 不泄漏未实现命令。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 覆盖 registry/order、basic list、limit、filters、tag、input、auth、help JSON、no side effects、scope guard | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、command tests、manifest/metadata tests、help JSON contract、YAML 校验 | none |
| Steps and checks traceability | pass | E | steps/checks 可解析，I1 已补 section order assertion | none |
| Roadmap contract compliance | pass | E/C | roadmap §4.2/§4.4 命令契约和 INFRA section 顺序已在 design/checklist 落地 | none |
| Module interface design | pass | E/C | design §2.1 明确 command/provider/auth/help seams，命令层不依赖 SDK raw response | none |
| Validation and artifacts | pass | E | 必跑命令与后续 review/QA/acceptance artifacts 已列出 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- `cac` 对重复 `--tag` 的 runtime shape 需要实现期 characterization；design/checklist 已要求 helper 兼容 `string | string[] | undefined` 并用 command test 锁定。
- IP/tag/namePrefix 的服务端可表达性由前置 provider feature 负责；本 command feature 不得本地过滤伪装支持。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；等待所有 child feature design-review 通过后统一给用户确认。
