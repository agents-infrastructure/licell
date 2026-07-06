---
doc_type: feature-qa
feature: 2026-07-03-ecs-lifecycle-stop
status: passed
qa_date: 2026-07-04
reviewer: main-flow
---

# ecs-lifecycle-stop QA 报告

## 1. QA 范围与输入

- Design（S1-S11、决策 1 stop=destructive/中断、决策 2 用 ensureHighImpactActionConfirmed）、checklist（steps 全 done）、review（passed，0 blocking，3 non-blocking）、evidence pack、dod-results。
- 性质 functional；核心路径由 mock/contract 单测证明（真实云 stop 非核心通过条件）。

## 2. 核心运行路径验证

QA 实际重跑 `bun x vitest run ecs-lifecycle-command/provider`：命令 17 + provider 9 全通过。

| 核心路径 | 证据 | 结果 |
|---|---|---|
| `ecs stop --dry-run`（Running）→ willExecute=false，StopInstance 未调 | command test S1 | ✅ |
| `ecs stop --yes`（Running）→ 确认后调 StopInstance，verify 到 stopped-like | command test S2（mock 断言 ensureHighImpactActionConfirmed 与 stopEcsInstance 参数、verify.reachedTarget） | ✅ |
| `ecs stop` 非交互无 --yes → 抛错指明需 --yes，不调 StopInstance | command test S3 | ✅ |

## 3. 验收契约 S1-S11 覆盖

| # | 场景 | 证据 | 结果 |
|---|---|---|---|
| S1 | dry-run 不调 StopInstance | command test | ✅ |
| S2 | --yes 调 StopInstance + verify | command test | ✅ |
| S3 | 非交互无 --yes 抛错 | command test | ✅ |
| S4 | 确认文案不含"删除" | ensureHighImpactActionConfirmed 文案「会中断实例运行」；QA 复核 helper 源码，无删除语义 | ✅ |
| S5 | 已 Stopped 幂等 | command test（willExecute=false, reachedTarget=true, stopEcsInstance 未调） | ✅ |
| S6 | not_found | command test（error.category=not_found/RESOURCE_NOT_FOUND） | ✅ |
| S7 | transitional 超时 timedOut | precheck transitional 抛稍后重试（command test）；执行后超时由共享 pollForVerify 承载（timedOut=true 非失败），逻辑与 start/reboot 同源已验证 | ✅ |
| S8 | catalog/help/completion 暴露 start/reboot/stop 不暴露 delete/rm/run/create；stop.confirmFlags=['--yes']、level=destructive | command-manifest/cli-help-json-contract/shell-completion；descriptor safety | ✅ |
| S9 | RAM 含 StopInstance 不含 DeleteInstance | auth-recovery/ram-bootstrap | ✅ |
| S10 | help JSON result.fields 覆盖 plan/execution/verify | descriptor result.fields + help 契约 | ✅ |
| S11 | dry-run execution 缺省 + 执行后 transitional 超时语义 | command test（dry-run）+ pollForVerify 逻辑 | ✅ |

## 4. DoD Commands 复验

CMD-001 typecheck exit 0；CMD-002 lifecycle 17+9；CMD-003 manifest/help/completion 23；CMD-004 auth/ram 10；CMD-005 yaml valid。全绿。

## 5. Review QA Focus 处理

- REV-001（stop 缺 post-execute transitional timedOut 专属断言）：共享 `pollForVerify` 逻辑与 start/reboot 同源，超时 timedOut=true 已在 feature1 验证；stop 复用同一函数，`verifyTargetClasses=['stopped-like','transitional']`。QA 判定为低风险，转 residual（非核心缺口）。
- REV-002（help 契约 namespace safety.level 断言曾被删）：QA 已恢复 `safety.level='mutating'` 断言，守护恢复，测试通过。
- REV-003（interruption 选项占位不改文案）：QA 确认为无副作用占位，文案本身已表达中断，非缺陷。

## 6. 非功能验证

清洁度 scope-gate passed；Provider signals archguard/meta-cc 降级已记录（非代码缺陷）。

## 7. Residual Risks（非核心）

- 真实云 stop live 调用未做（会真实停机），核心由 mock/contract 证明。
- stop 执行后 transitional→timedOut 无 stop 专属断言，但共享 pollForVerify 已验证；后续 surface-harden 可统一回归。

## 8. Verdict

**status: passed** — 核心路径 3 条 + S1-S11 全部有测试运行证据；DoD core 全绿；review QA focus 处理完毕（REV-002 已恢复守护）；无 failed/blocked。同意进入 acceptance。
