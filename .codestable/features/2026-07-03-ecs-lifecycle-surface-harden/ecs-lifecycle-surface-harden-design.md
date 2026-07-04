---
doc_type: feature-design
feature: 2026-07-03-ecs-lifecycle-surface-harden
roadmap: ecs-lifecycle-operations
roadmap_item: ecs-lifecycle-surface-harden
status: approved
summary: 整体命令 surface 同步与回归收口，让 catalog/help/completion/README/agent-surface/skill scaffold 反映最终 ecs lifecycle 命令集，并统一 dry-run/确认/verify 契约回归
tags: [ecs, lifecycle, docs, surface, harden, regression]
---

# ecs-lifecycle-surface-harden feature design

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| docs pipeline（4 targets） | `docs:sync`/`docs:check` 实际覆盖的 generator target：`README.md`、`docs/reference/agent-surfaces.md`、`docs/scenarios/02-ai-driven-deployment.md`、`docs/scenarios/03-domain-and-https.md`（见 `src/utils/docs-pipeline.ts:24`）。 | **不含 skill scaffold 与 shell completion**（blocking 修正）。 |
| skill scaffold 同步 | `.claude/skills/licell/SKILL.md` 与 renderer 一致，由 `skills-scaffold.test.ts` 的 committed scaffold sync 测试证明。 | 不属于 docs pipeline，单独测试证明。 |
| completion 同步 | shell completion 从 command graph 运行时解析，由 `shell-completion.test.ts` 证明。 | 不属于 docs pipeline，单独测试证明。 |
| 契约回归收口 | 跨四命令统一验证 dry-run/确认/verify 行为一致，无漂移。 | 不新增命令或行为，只补跨命令一致性测试与文档。 |

## 1. 决策与约束

### 需求摘要（依赖 ecs-lifecycle-stop、ecs-lifecycle-delete）

**前置 gate（important-1）**：本 feature 执行前必须确认 `ecs start/reboot/stop/rm/delete` 已在 command registry / catalog / help 中存在，且 `ecs-lifecycle-stop`、`ecs-lifecycle-delete` 对应 feature 已 acceptance passed；否则本 feature blocked，不得跑 docs sync / 翻转 guard。

surface 同步按各自证据入口（blocking 修正，不再统称"4 targets"）：
- **README / agent-surfaces / scenario docs**：`bun run docs:sync` 生成 + `bun run docs:check` 对拍无 drift（docs pipeline 4 targets）。
- **skill scaffold**：`skills-scaffold.test.ts` 断言 committed `.claude/skills/licell/SKILL.md` 与 renderer 一致，wording 覆盖 lifecycle 而非只说 ECS 查询。
- **shell completion**：`shell-completion.test.ts` 断言 `ecs` subcommands 含 start/reboot/stop/delete/rm，不含 run/create。
- **catalog/help JSON**：`cli-help-json-contract.test.ts` 断言 namespace subcommands、per-command safety、confirmFlags、recommendedFlow/result fields。
- 补/加固跨命令一致性测试：dry-run 不触发 mutating、确认策略矩阵、**verify 契约字段级一致**（见 §3 H8）、safety metadata。
- 更新 `ecs-operations-support/ecs-lifecycle-command-seeds.md` 状态（seed 已消费）。

### 明确不做

- 不新增任何命令或改命令行为（纯 surface + 回归）。
- 不改 provider / harness 逻辑。
- 不实现 run/create（仍明确不做）。

### 复杂度档位

`Testability=tested`、`Readability=team`：以 generator 对拍与跨命令回归测试为主，无新运行逻辑。

### 关键决策 / 假设

1. **generated docs 只由 generator 产出**：本 feature 跑 `docs:sync` 而非手改，`docs:check` 保证对拍。
2. **修正认知（blocking）**：`docs:sync`/`docs:check` 的 4 targets 是 README/agent-surfaces/scenarios02/scenarios03，**不含 skill scaffold 与 completion**。skill 由 `skills-scaffold.test.ts`、completion 由 `shell-completion.test.ts` 分别证明，不能用"docs:check 4 targets 通过"冒充 skill/completion 已同步。若真要让 docs:sync 管 skill/completion，那是 generator target 变更、超出本 feature"纯 docs+tests 不改行为"边界，需另行明确（记为观察项）。

## 2. 名词层与编排层

### 2.1 名词层（现状 → 变化）
**现状**：README/agent-surfaces/skill scaffold/completion 反映 list/info（+ 前三 feature 落地时各自更新的 catalog/help 测试）。
**变化**：无新类型；仅 generated docs 内容随命令集刷新。

### 2.2 编排层（现状 → 变化）
**现状**：docs:sync generator 已存在，四 target。
**变化**：无编排变化；执行 generator + 补跨命令回归测试。无需流程图。

### 2.3 挂载点
1. generated docs 内容（README block/agent-surfaces.md/SKILL.md/completion）——由 generator 管理
2. 跨命令一致性回归测试文件
3. seed 状态更新

（本 feature 是收口，挂载点少属正常。）

### 2.4 推进策略
1. 跑 `docs:sync`，`docs:check` 对拍绿
2. 补跨命令一致性测试（dry-run 无副作用、确认策略矩阵、verify 契约、safety metadata 全命令）
3. 更新 seed 状态 + 全量 lifecycle 测试回归

### 2.5 结构健康度与微重构
纯 surface/docs + 测试，无源码结构变化。**结论：不做微重构**。目录级无变化。超出范围观察：若某 generator 未覆盖 lifecycle 命令，记观察项提示后续修 generator。

## 3. 验收契约

| # | 输入 / 触发 | 期望可观察结果 | 证据类型 |
|---|---|---|---|
| H0 | 前置 gate | `ecs start/reboot/stop/rm/delete` 已在 registry/catalog/help；stop/delete feature 已 acceptance passed，否则 blocked | diff/registry 核验 |
| H1 | `bun run docs:check` | README/agent-surfaces/scenario docs in sync（4 targets），含 lifecycle 命令 | 命令输出 |
| H2a | skill scaffold | `skills-scaffold.test.ts`：committed SKILL.md 含 start/reboot/stop/rm/delete，wording 覆盖 lifecycle | 单测 |
| H2b | shell completion | `shell-completion.test.ts`：`ecs` subcommands 含 start/reboot/stop/delete/rm，不含 run/create | 单测 |
| H2c | catalog/help JSON | `cli-help-json-contract.test.ts`：namespace subcommands、per-command safety、confirmFlags、recommendedFlow/result fields | 单测 |
| H3 | 跨命令一致性测试 | 所有 lifecycle 命令 dry-run 不触发 mutating | 单测 |
| H4 | 确认策略矩阵测试 | start 免确认；reboot/stop/delete 非交互需确认 flag | 单测 |
| H5 | safety metadata 测试 | start/reboot=mutating、stop/delete=destructive；confirmFlags 正确 | 单测 |
| H6 | seed 状态 | ecs-lifecycle-command-seeds.md 标记为已消费 | diff review |
| H7 | 全量 lifecycle 回归 | ecs-lifecycle 全部测试通过 | 命令输出 |
| H8 | verify 契约字段级一致（important-2） | 全命令 `verify.statusClass/reachedTarget/timedOut`；delete `verify.notFound` 终态；dry-run 下 `execution` 缺省且 verify 形状稳定 | 单测 |

**明确不做反向核对**：generated docs 无 run/create 命令；无 provider/harness 逻辑改动（diff 只含 docs + tests + seed）。

### Acceptance Coverage Matrix
| 场景 | 前置 | docs/surface | 一致性回归 | safety/verify | seed |
|---|---|---|---|---|---|
| surface | H0 | H1/H2a/H2b/H2c | H3/H4 | H5/H8 | H6 |
| 回归 | — | — | H7 | — | — |

### DoD Contract
- 必跑：`bun run typecheck`、`bun run docs:check`、`bun x vitest run`（lifecycle + surface tests）、`validate-yaml.py`
- 证据：command_output、diff_summary、review_report、qa_report、acceptance_report
- 清洁度：禁调试输出/TODO/注释代码/死 import；diff 不含源码逻辑改动

## 执行风险与证据计划
- **Top 3 风险**：generator 未覆盖某命令导致 drift（H1/H2 缓解 + 观察项）；跨命令确认策略回归遗漏（H4 缓解）；误改源码逻辑越界（diff review 反向核对缓解）。
- **非显然依赖**：依赖 stop、delete 两 feature 已合入（命令集完整）。
- **关键假设**：docs:sync 四 target 已覆盖 lifecycle（决策2）。
- **交付物**：generated docs 刷新、跨命令一致性测试、seed 状态更新。
- **清洁度**：无临时输出/TODO；diff 限于 docs+tests+seed。
