---
doc_type: feature-review
feature: 2026-07-03-ecs-lifecycle-surface-harden
reviewer: subagent
status: passed
reviewed: 2026-07-05
---

# ecs-lifecycle-surface-harden feature review

## 1. 范围与输入

本 feature 为 ECS lifecycle 整体命令 surface 同步与回归收口，纯 docs + tests + seed，不改源码逻辑。

已读取输入：
- Design：`ecs-lifecycle-surface-harden-design.md`（H0-H8；决策2：docs pipeline 仅 4 targets = README/agent-surfaces/scenarios02/03，不含 skill/completion）
- Checklist：`ecs-lifecycle-surface-harden-checklist.yaml`（5 steps 全 done；dod CMD-001~005）
- Evidence pack：`ecs-lifecycle-surface-harden-evidence-pack.md`（DoD 全 passed，scope-gate passed）
- git diff（相对 HEAD）+ 未跟踪的新增测试 `src/__tests__/ecs-lifecycle-surface.test.ts`

## 2. 纯 surface 边界核验（git diff --name-only）

`git diff --name-only HEAD` 变更文件（tracked）：
- `.codestable/features/.../ecs-lifecycle-surface-harden-checklist.yaml`
- `.codestable/features/.../ecs-lifecycle-surface-harden-design.md`
- `.codestable/roadmap/ecs-operations-support/ecs-lifecycle-command-seeds.md`（seed → consumed）
- `README.md`、`docs/reference/agent-surfaces.md`（generated docs）
- `src/__tests__/agent-surface-docs.test.ts`、`src/__tests__/readme-docs.test.ts`（守护断言翻转）

未跟踪新增：`src/__tests__/ecs-lifecycle-surface.test.ts`（跨命令一致性回归）。

边界判定（最重要项，通过）：
- `git diff --name-only HEAD -- src/ | grep -v __tests__` → **NO non-test src changes**
- `git diff --name-only HEAD -- src/commands/ src/providers/ src/utils/` → **空**

结论：diff 只含 generated docs + 测试（仅 `src/__tests__/`）+ seed + feature 文档，**无任何 src 源码逻辑改动**。纯 surface 边界成立。

## 3. H0-H8 逐项核对

- **H0（前置 gate，通过）**：`src/commands/ecs.ts:426` namespace `commands: [ecsListCommand, ecsInfoCommand, ecsStartCommand, ecsRebootCommand, ecsStopCommand, ecsDeleteCommand, ecsRmCommand]`——start/reboot/stop/delete/rm 均已在 registry/catalog（前三 feature 已合入）。stop/delete feature 对应 task #2/#3 均 completed。
- **H1（通过）**：`bun run docs:check` → `generated docs are in sync (4 targets)`。README 与 agent-surfaces 命令表均含全部 5 个 lifecycle 命令（delete/reboot/rm/start/stop），无 run/create。
- **H2a（skill scaffold，非本 diff 直接改动但已由 CMD-003 覆盖）**：evidence pack 显示 `skills-scaffold.test.ts` 15 tests 全过。
- **H2b（shell completion，通过）**：`shell-completion.test.ts:38` 断言 ecs subcommands `arrayContaining(['list','info','start','reboot','stop','delete','rm'])`；`ECS_LIFECYCLE_COMPLETIONS = ['run','create']` 作为排除项。
- **H2c（catalog/help JSON，通过）**：`cli-help-json-contract.test.ts:66-72` 锁定 ecs namespace subcommands 含 info/list/start/reboot/stop/delete/rm；`ECS_LIFECYCLE_HELP_PATTERN` 排除 run/create/RunInstances。
- **H3（通过）**：`ecs-lifecycle-surface.test.ts` H3 断言全 5 命令 options 含 `--dry-run`。
- **H4（通过）**：H4 断言 start `confirmFlags === []`，reboot/stop/delete/rm 均 `toContain('--yes')`。
- **H5（通过）**：H5 safety 矩阵——start/reboot=`mutating`、stop/delete/rm=`destructive`；confirmFlags 与源码 `src/commands/ecs-lifecycle.ts`（line 187/252/321/384）一致。
- **H8（通过）**：H8 断言统一 plan 字段（plan.action/regionId/instanceId/currentStatusClass/requiresConfirmation/willExecute）+ execution.requestId + verify.reachedTarget；state-transition 命令（start/reboot/stop）含 verify.statusClass/verify.timedOut；delete/rm 含 verify.notFound 终态 + plan.releaseFacts。字段级一致契约成立。
- 另有 recommendedFlow 断言：每命令 flow ≥3 步且含 `--dry-run`，覆盖 dry-run→execute→verify。

新增 surface 测试实跑：`bun x vitest run src/__tests__/ecs-lifecycle-surface.test.ts` → **7 passed**。

## 4. 守护断言更新正确性

`agent-surface-docs.test.ts` 与 `readme-docs.test.ts` 的守护更新方向正确，未削弱：
- 旧断言 `not.toMatch(/licell ecs (start|stop|reboot|delete|rm)|runInstances/)`（排除全部 lifecycle）
- 新断言 `not.toMatch(/licell ecs (run|create)|runInstances/)`（仅排除 run/create），**同时新增正向 `toContain` 断言** 覆盖 start/reboot/stop/delete/rm 存在。

关键点：run/create 排除项**未被删除**，只是收窄了排除范围并补齐了 lifecycle 存在性断言——守护未被改弱，`runInstances` 反向哨兵仍在。实跑 `agent-surface-docs` + `readme-docs` → **5 passed**。

## 5. Findings

### Blocking
无。

### Non-blocking

- **REV-001（观察，non-blocking）**：`README.md:34` 能力概览 prose 仍为 `- ECS 实例只读查询与详情诊断`，文案已过时（现已支持 lifecycle 变更命令）。该行位于 generated block（line 519-826）**之外**，属手写 section-intro 静态 prose，非 generator 产出，不构成 drift；且权威命令清单（生成块内命令表）已正确反映全部 lifecycle 命令。判定 non-blocking，建议后续文案批次修正为「查询/详情诊断 + 生命周期管理（start/reboot/stop/delete）」。

- **REV-002（观察，non-blocking）**：`readme-docs.test.ts:69` 显式断言 `expect(readme).toContain('ECS 实例只读查询与详情诊断')`，将测试耦合到 REV-001 的过时静态文案。当前不阻断（仍是真实存在的文本），但当 REV-001 修正文案时需同步更新此断言，否则会红。建议与 REV-001 一并处理。

- **REV-003（信息，non-blocking）**：新增 `ecs-lifecycle-surface.test.ts` 未列入 checklist `dod.commands` 的显式 CMD（CMD-003/004 未包含该文件）。本地实跑 7 passed，功能无问题；仅提示 DoD 命令集未把新回归文件纳入固定跑批，建议后续将其加入 surface 测试 CMD 以防回归遗漏。

## 6. Test And QA Focus

- 已实跑验证：docs:check（4 targets in sync）、`ecs-lifecycle-surface.test.ts`（7 passed）、`agent-surface-docs`+`readme-docs`（5 passed）。
- Evidence pack 记录 CMD-001~005 全 exit 0：typecheck、docs:check、surface/completion/catalog 五测试文件（39 passed）、ecs-lifecycle-command（25 passed）、yaml 校验。
- 建议关注：REV-003 将新 surface 测试纳入固定 CMD；REV-001/002 文案与耦合断言的后续联动修正。
- 范围守护复核：无 run/create 命令进入任何 surface；无 provider/harness/命令逻辑改动（已由 diff 核验）。

## 7. Verdict

status: **passed**

- 纯 surface 边界成立（零源码逻辑改动，仅 docs + `src/__tests__/` + seed）。
- H0-H8 全部满足；守护断言翻转方向正确且未削弱（run/create 排除项保留，新增 lifecycle 正向断言）。
- seed 已正确标记 consumed（consumed_by/consumed 元数据齐备）。
- 无 debug/TODO/注释代码/死 import。
- 仅 3 项 non-blocking 观察（均为过时静态文案与其耦合断言、及新测试未纳入 CMD 的流程建议），不阻断验收。

无 blocking，允许 status=passed。
