---
doc_type: roadmap-goal-audit
roadmap: ecs-lifecycle-operations
status: passed
audited: 2026-07-05
round: 1
---

# ecs-lifecycle-operations Goal 最终审计

## 1. Scope

Roadmap `ecs-lifecycle-operations` 交付 ECS 实例完整生命周期 CLI 命令：`ecs start` / `ecs reboot`（feature 1）、`ecs stop`（feature 2）、`ecs delete` / `ecs rm`（feature 3），以及命令 surface 同步与回归收口（feature 4）。全部 4 个 feature 已 implement → review（独立 subagent）→ QA → acceptance 完整走完并 accepted。

本次审计核验：goal-state / items 一致性、每 feature 交付物与状态、最终聚合命令重跑、工作区清洁度、provider 与 E/C/H 证据。

## 2. Roadmap State

| feature | roadmap item | review | QA | acceptance | checklist steps/checks |
|---|---|---|---|---|---|
| ecs-lifecycle-start-reboot | done | passed | passed | passed | steps done / checks passed |
| ecs-lifecycle-stop | done | passed | passed | passed | steps done / checks passed |
| ecs-lifecycle-delete | done | passed | passed | passed | steps done / checks passed |
| ecs-lifecycle-surface-harden | done | passed | passed | passed | steps done / checks passed |

- `goal-state.yaml`：4 features 全部 `status: accepted`，`current_feature_index: 4`（= feature count），`status: completed`。
- `items.yaml`：4 条 item 全部 `status: done`，无 dropped。
- 机器一致性 gate `codestable-goal-consistency-gate.py`：见第 9 节，status=passed（0 blocking）。

## 3. Final Aggregate Commands

按 goal-plan「最终聚合命令集合」重跑（真实执行，未 trust-prior）：

| 命令 | 结果 |
|---|---|
| `bun run typecheck` | ✅ 0 error |
| `bun run test:ci`（文件级串行全量 vitest） | ✅ 134 files / 982 tests passed |
| `bun run docs:check` | ✅ generated docs in sync (4 targets) |
| `codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/ecs-lifecycle-operations` | ✅ status=passed |

test:ci 首轮暴露 5 个遗留 surface guard 失败（command-reference / command-registry / command-surface-metadata 仍断言只读 ecs surface），已在审计 repair 阶段更新为反映最终 lifecycle 命令集（仅排除 run/create），重跑全绿。

## 4. Core Acceptance Paths

roadmap §3-§4 功能性核心路径（由 mock/contract 单测真实运行证明；真实云 mutating 调用按 roadmap 决策不属核心通过条件，作残余风险）：

| 核心路径 | 证据 | 结果 |
|---|---|---|
| `ecs start i-x --dry-run` → willExecute=false，mutating 未调 | ecs-lifecycle-command.test（A1） | ✅ |
| `ecs reboot i-x --dry-run`（无 --yes）→ requiresConfirmation=true/willExecute=false，不确认不 mutating | A11 | ✅ |
| `ecs stop` / `ecs rm` 非交互无 --yes 抛错 | S3 / D3 | ✅ |
| `ecs rm` releaseFacts 不可读 → 阻断执行 | D4 | ✅ |
| `ecs rm` deletionProtection=true → 阻断 | D5 | ✅ |
| 全命令 catalog/help/completion 可发现，safety/confirmFlags 正确 | command-manifest / cli-help-json-contract / shell-completion / ecs-lifecycle-surface | ✅ |

## 5. Deliverables And Writebacks

- 代码：`src/providers/ecs/lifecycle.ts`（start/reboot/stop/delete wrapper + getEcsInstanceReleaseFacts）、`src/providers/ecs/types.ts`、`src/commands/ecs-lifecycle.ts`（harness + 5 命令）、`src/commands/ecs.ts`（注册）、`src/utils/cli-shared.ts`（ensureHighImpactActionConfirmed）、`src/utils/auth-recovery.ts` / `src/providers/ram.ts`（RAM Start/Reboot/Stop/Delete + DescribeDisks）。
- 测试：`ecs-lifecycle-command.test.ts`、`ecs-lifecycle-provider.test.ts`、`ecs-lifecycle-surface.test.ts` + 更新的 guard（manifest/help/completion/auth/ram/command-reference/command-registry/command-surface-metadata/agent-surface-docs/readme-docs）。
- generated docs：README / agent-surfaces 经 docs:sync 刷新，含全部 lifecycle 命令。
- 回写：items.yaml 4 条 done、goal-state 4 features accepted + completed、seed `ecs-lifecycle-command-seeds.md` 标记 consumed。
- architecture / requirement 回写：无独立 architecture 文档；harness 契约在代码 + review/QA 中固化，无外部 requirement 文档需更新（不适用）。

## 6. QA Residual Risk Review

各 feature QA 的 residual risks 均为非核心：
- 真实阿里云 ECS live mutating（start/reboot/stop/delete）调用未做——按 roadmap 决策非核心通过条件，核心由 mock/contract 证明，真实云 smoke 留人工/后续。
- bounded polling N/T=6×5s≈30s 初值常量；超时仅 timedOut=true 非失败。
- delete verify 权限/网络错误超时护栏无 30s 真实用例——谓词 `isNotFoundReadError` 经 code-inspection 证明不误判（不谎报删除成功）。
- SKILL.md 脚手架命令无关（renderer 设计），不枚举 ecs 子命令。

无 residual risk 隐藏核心验收缺口。

## 7. Provider And E/C/H Evidence Summary

- **Feature evidence packs**：4 个 `{slug}-evidence-pack.md` + `-evidence-pack-results.json`（status=passed/generated）、`-gate-results.json`、`-dod-results.json`、`-dod-contract-results.json` 全部存在且 passed。
- **Provider signals**：archguard 二进制存在但 minimal 模式未采集风险摘要（证据采集降级，非代码缺陷）；meta-cc unavailable（有 fallback reason：summary 文件不存在、realtime 采集超范围）。两者按 Provider Policy 记录，均已由 review/QA 解释，不阻塞。
- **E/C/H summary**：核心验收路径均有 **C（contract/命令测试实跑）+ E（provider mock 执行）** 证据，非 H-only。
- **H-only core checks**：无。核心完成判断不依赖 H-only evidence。

## 8. Workspace And Cleanliness

- `git status --short`：clean（所有交付物已 scoped-commit）。
- tracked/staged/unstaged/untracked：无残留。
- 调试输出：新增 ecs 源码仅含用户可见 `console.log(pc...)` CLI 输出（与既有 ecs.ts 同款），无 debug logger。
- 临时 TODO/FIXME/XXX：无。
- 注释掉代码：无（仅描述性注释）。
- 同名工具 shim / 临时 runner / `__pycache__` / 临时下载包：无。

## 9. Verdict

**status: passed**。goal-state 全 accepted + completed；items 全 done；每 feature review/QA/acceptance 均 passed，checklist steps 全 done、checks 全 passed；5 类机器产物齐备且 passed；最终聚合命令（typecheck / test:ci 982 / docs:check / consistency-gate）全部真实重跑通过；工作区干净；无 H-only 核心缺口；provider warnings 已解释。roadmap `ecs-lifecycle-operations` 目标达成。
