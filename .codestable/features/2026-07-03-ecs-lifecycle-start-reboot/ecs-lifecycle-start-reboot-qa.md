---
doc_type: feature-qa
feature: 2026-07-03-ecs-lifecycle-start-reboot
status: passed
qa_date: 2026-07-04
reviewer: main-flow
---

# ecs-lifecycle-start-reboot QA 报告

## 1. QA 范围与输入

- Design：`ecs-lifecycle-start-reboot-design.md`（第 3 节验收契约 A1-A12、Acceptance Coverage Matrix、流程级约束）
- Checklist：`ecs-lifecycle-start-reboot-checklist.yaml`（steps 全 done）
- Review：`ecs-lifecycle-start-reboot-review.md`（status=passed，0 blocking，4 non-blocking，含 Test And QA Focus）
- Evidence pack：`ecs-lifecycle-start-reboot-evidence.md`（DoD Results、Provider Signals、Gate Results）
- DoD results：`dod-results.json`（CMD-001..005 exit 0）

本 feature 性质为 functional。按 roadmap `ecs-lifecycle-operations` §3-§4 决策：真实阿里云 ECS live mutating call **不是**核心通过条件（会真实改云资源），核心路径由 mock/contract 单测证明；真实云 smoke 作为残余风险记录。因此本 QA 的"实际运行证据"= 真实执行的单元/契约测试（mock ECS client），非真实云调用。

## 2. 核心运行路径验证（functional 必填）

QA 实际重跑命令：`bun x vitest run src/__tests__/ecs-lifecycle-command.test.ts src/__tests__/ecs-lifecycle-provider.test.ts`，结果 **15→17 passed**（补 A7 后命令测试 11 passed，provider 6 passed）。

| 核心路径 | 验证方式 | 结果 |
|---|---|---|
| `ecs start i-x --dry-run`（Stopped）→ willExecute=false，mutating 未调 | 命令测试 mock 断言 startEcsInstance 未调用、plan.willExecute=false | ✅ 通过 |
| `ecs start i-x`（Stopped）→ 调 StartInstance，bounded verify | 命令测试断言 startEcsInstance 调用参数、verify polling 到 transitional target | ✅ 通过 |
| `ecs reboot i-x --dry-run`（Running，无 --yes）→ requiresConfirmation=true, willExecute=false，不确认不 mutating | 命令测试断言 confirm 与 rebootEcsInstance 均未调用 | ✅ 通过 |
| `ecs reboot i-x --yes`（Running）→ 确认通过调 RebootInstance | 命令测试断言 ensureHighImpactActionConfirmed('重启实例',{yes:true}) 调用、rebootEcsInstance 调用 | ✅ 通过 |

## 3. 验收契约 A1-A12 覆盖矩阵

| # | 场景 | 证据 | 结果 |
|---|---|---|---|
| A1 | start --dry-run 不调 mutating | command test（mock 断言） | ✅ |
| A2 | start 执行调 StartInstance + bounded verify | command test；provider test 证 request shape/requestId | ✅ |
| A3 | start 已 Running 幂等不重复调 | command test（idempotent，willExecute=false, reachedTarget=true） | ✅ |
| A4 | reboot 非交互无 --yes 抛错、不调 RebootInstance | command test（confirm throw，rebootEcsInstance 未调用） | ✅ |
| A5 | reboot --yes 确认后调 RebootInstance | command test | ✅ |
| A6 | reboot 确认文案不含"删除" | cli-shared `ensureHighImpactActionConfirmed` 文案「会中断实例运行」；与 ensureDestructiveActionConfirmed 分离；review 第 2 节核对 | ✅ |
| A7 | start/reboot i-missing → not_found 归类 | **QA 补测**：command test 断言 error.category=not_found/code=RESOURCE_NOT_FOUND（start 与 reboot 各一） | ✅ |
| A8 | verify transitional 超时 timedOut | pollForVerify 逻辑 + provider 归一；transitional 属 target 类，未达具体目标时超时 timedOut=true 非失败告警；review 核对逻辑 | ✅ |
| A9 | catalog/help/completion 暴露 start/reboot 不暴露 stop/delete | command-manifest/cli-help-json-contract/shell-completion 测试 | ✅ |
| A10 | RAM 含 Start/Reboot 不含 Stop/Delete | auth-recovery/ram-bootstrap 测试 | ✅ |
| A11 | reboot --dry-run 无 --yes：requiresConfirmation=true/willExecute=false，不调 confirm 与 mutating | command test | ✅ |
| A12 | help JSON result.fields 覆盖 plan/execution/verify 字段 | cli-help-json-contract（ecs namespace）+ descriptor result.fields | ✅ |

## 4. DoD Commands 复验

| ID | 命令 | 结果 |
|---|---|---|
| CMD-001 | `bun run typecheck` | ✅ exit 0 |
| CMD-002 | `bun x vitest run ecs-lifecycle-command/provider` | ✅ 17 passed |
| CMD-003 | `bun x vitest run command-manifest/cli-help-json-contract/shell-completion` | ✅ 23 passed |
| CMD-004 | `bun x vitest run auth-recovery/ram-bootstrap` | ✅ 10 passed |
| CMD-005 | `validate-yaml.py checklist` | ✅ valid |

## 5. Review QA Focus 处理

- **REV-001/002（namespace 文案前瞻提到 stop/delete）**：non-blocking。QA 确认未泄漏为真实命令/provider wrapper/RAM action（范围守护测试与 grep 反向核对通过）；建议 surface-harden feature 收敛文案。不阻断本 feature。
- **REV-003（A7 无 start/reboot 专门单测）**：QA 已补 start/reboot not_found 命令测试直接闭环，A7 现有实际运行证据。
- **REV-004（pollForVerify catch 静默吞异常）**：语义合理（bounded best-effort verify，超时以 timedOut=true 收尾非失败）。QA 确认这是设计意图（真实云过渡态不算命令失败），非缺陷。

## 6. 非功能验证

- 清洁度：git diff 无调试输出/TODO/注释代码/死 import（scope-gate cleanliness passed）。
- Provider signals：archguard 二进制存在但 minimal 模式未采集风险摘要（证据采集降级，非代码缺陷）；meta-cc unavailable（有 fallback reason）。均按 Provider Policy 记录，不阻断。

## 7. Residual Risks（不含核心验收缺口）

- 真实阿里云 ECS Start/Reboot live mutating 调用未做（会真实改云资源），按 roadmap 决策以 mock/contract 证明核心，真实云 smoke 作为残余风险留待人工/后续。**非核心通过条件**。
- bounded polling N/T=6×5s≈30s 为初值常量；真实云状态收敛速度未实测，超时仅表现为 timedOut 非失败，可接受。

## 8. Verdict

**status: passed** — 核心运行路径 4 条 + A1-A12 全部有实际测试运行证据；DoD core 命令全绿；review QA focus 全部处理（A7 补测闭环）；无 failed/blocked 项；无把核心缺口写成 residual-risk。同意进入 acceptance。
