---
doc_type: feature-qa
feature: 2026-07-03-ecs-lifecycle-surface-harden
status: passed
qa_date: 2026-07-05
reviewer: main-flow
---

# ecs-lifecycle-surface-harden QA 报告

## 1. QA 范围与输入

Design（H0-H8、决策2 docs pipeline 仅 4 targets）、checklist（steps 全 done）、review（passed，0 blocking，3 non-blocking）、evidence pack、dod-results。性质 non-functional（纯 surface + 回归收口，无源码逻辑改动）。按 goal-plan：非功能性 feature 用静态/一致性/schema/文档校验替代真实运行证据——本 QA 的证据为 docs:check 对拍 + 跨命令一致性测试 + guard 测试全绿。

## 2. 核心验证（非功能性替代证据理由）

本 feature 不引入运行逻辑，无"功能性核心运行路径"。按 gate 要求，非功能性 feature 用以下替代证据：

| 验证 | 手段 | 结果 |
|---|---|---|
| H1 generated docs 反映最终命令集 | `bun run docs:check` 4 targets in sync；README/agent-surfaces 含 5 个 lifecycle 命令 | ✅ |
| H2b/H2c surface guards | shell-completion / cli-help-json-contract 断言含 start/reboot/stop/delete/rm 不含 run/create | ✅ |
| H3/H4/H5/H8 跨命令一致性 | 新增 ecs-lifecycle-surface.test.ts（7 tests）实跑 | ✅ |
| H7 全量 lifecycle 回归 | 13 文件 121 tests 全绿 | ✅ |

## 3. 验收契约 H0-H8 覆盖

| # | 场景 | 证据 | 结果 |
|---|---|---|---|
| H0 | 前置 gate：5 命令在 registry/catalog/help，stop/delete accepted | registry 核验（ecs.ts commands 数组）+ goal-state features accepted | ✅ |
| H1 | docs:check README/agent-surfaces/scenarios in sync | 命令输出 "in sync (4 targets)" | ✅ |
| H2a | skill scaffold | skills-scaffold.test.ts 15 passed（committed==renderer）；SKILL.md 为命令无关高层脚手架（观察项：不枚举 ecs 子命令，属 renderer 设计） | ✅ |
| H2b | shell completion 含 lifecycle 不含 run/create | shell-completion.test.ts | ✅ |
| H2c | catalog/help namespace subcommands/safety/confirmFlags | cli-help-json-contract.test.ts（namespace 7 subcommands） | ✅ |
| H3 | 全命令 dry-run 无副作用 | ecs-lifecycle-command.test.ts 各命令 dry-run 断言 + surface test --dry-run 选项矩阵 | ✅ |
| H4 | 确认策略矩阵 | surface test（start=[]、reboot/stop/delete/rm=['--yes']）+ 各命令行为测试 | ✅ |
| H5 | safety metadata | surface test（start/reboot=mutating、stop/delete/rm=destructive） | ✅ |
| H6 | seed 标记 consumed | ecs-lifecycle-command-seeds.md frontmatter status=consumed + consumed_by/consumed | ✅ |
| H7 | 全量 lifecycle 回归 | 121 tests 全绿 | ✅ |
| H8 | verify 契约字段级一致 | surface test（statusClass/reachedTarget/timedOut 全命令；delete notFound + releaseFacts） | ✅ |

## 4. DoD Commands 复验

CMD-001 typecheck 0 error；CMD-002 docs:check in sync；CMD-003 help/completion/agent-surface/readme/skill 39；CMD-004 ecs-lifecycle-command；CMD-005 yaml valid。全绿。

## 5. Review QA Focus 处理

- REV-001/002（README 静态 prose "只读查询" 过时 + 测试耦合）：QA 已更新为「ECS 实例查询、详情诊断与生命周期操作（启动/重启/停止/删除）」并同步 readme-docs.test.ts:69 断言；docs:check 仍 in sync（该 bullet 在生成块外，编辑不影响 generator 对拍）。
- REV-003（新 surface 测试未纳入 checklist CMD）：观察项；ecs-lifecycle-surface.test.ts 已被 CMD-004 的 lifecycle 测试范围间接覆盖运行（同目录同 glob），全量回归含它。留后续可显式补 CMD。

## 6. 纯 surface 边界确认

`git diff --name-only HEAD` 仅含 generated docs（README/agent-surfaces）+ 测试（src/__tests__/）+ seed + feature 文档；src/commands、src/providers、src/utils 源码逻辑零 diff（reviewer 已独立核验）。满足 design「diff 不含源码逻辑改动」。

## 7. Residual Risks（非核心）

- SKILL.md 脚手架命令无关，不枚举 ecs 子命令（renderer 设计），未来若需 per-command skill wording 属 renderer 变更，超本 feature 范围。

## 8. Verdict

**status: passed** — H0-H8 全部有证据（非功能性以 docs:check 对拍 + 一致性测试 + 全量回归替代运行证据，理由已述）；纯 surface 边界确认；review QA focus 处理完毕（REV-001/002 已修）。无 failed/blocked。同意进入 acceptance。
