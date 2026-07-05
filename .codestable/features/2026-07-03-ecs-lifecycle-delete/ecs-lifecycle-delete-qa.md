---
doc_type: feature-qa
feature: 2026-07-03-ecs-lifecycle-delete
status: passed
qa_date: 2026-07-05
reviewer: main-flow
---

# ecs-lifecycle-delete QA 报告

## 1. QA 范围与输入

Design（D1-D10、决策1 不可读即阻断、决策2 deletionProtection 阻断、FDR-001 确认语义）、checklist（steps 全 done）、review（passed，0 blocking，3 non-blocking + 2 QA 建议）、evidence pack、dod-results。性质 functional；核心由 mock/contract 单测证明（真实云 delete 非核心通过条件，会真实释放实例）。

## 2. 核心运行路径验证

QA 重跑 `bun x vitest run ecs-lifecycle-command/provider`：命令 33 + provider 15 全通过。

| 核心路径 | 证据 | 结果 |
|---|---|---|
| `ecs rm --dry-run` → willExecute=false，DeleteInstance 未调，plan.releaseFacts 有值 | command test D1 | ✅ |
| `ecs rm --yes` → 双确认后调 DeleteInstance，verify notFound=true | command test D2 | ✅ |
| `ecs rm` 非交互无 --yes → 抛错，不调 DeleteInstance | command test D3 | ✅ |
| releaseFacts 不可读 → 阻断，不调 delete/confirm | command test D4 | ✅ |
| deletionProtection=true → 阻断 | command test D5 | ✅ |

## 3. 验收契约 D1-D10 覆盖

| # | 场景 | 证据 | 结果 |
|---|---|---|---|
| D1 | dry-run 不调 DeleteInstance + releaseFacts | command test | ✅ |
| D2 | --yes 调 DeleteInstance + verify notFound | command test | ✅ |
| D2b | 交互无 --yes 双确认路径 | command test（isInteractiveTTY=true，ensureDestructiveActionConfirmed 被调 yes:false） | ✅ |
| D3 | 非交互无 --yes 抛错 | command test | ✅ |
| D4 | releaseFacts 不可读阻断 | command test（getEcsInstanceReleaseFacts reject → 阻断，delete/confirm 未调） | ✅ |
| D5 | deletionProtection=true 阻断 | command test | ✅ |
| D6 | 删除文案 | ensureDestructiveActionConfirmed 文案"将删除云端资源"；QA 复核 helper 源码 | ✅ |
| D7 | not_found | command test（error.category=not_found） | ✅ |
| D8 | rm 与 delete 同 action 一致 | command test（rm 路径断言 action=delete、notFound=true） | ✅ |
| D9 | catalog/help/completion 暴露 start/reboot/stop/delete/rm 不暴露 run/create；delete.level=destructive/confirmFlags=['--yes'] | command-manifest/cli-help-json-contract/shell-completion；descriptor safety | ✅ |
| D10 | RAM 含 DeleteInstance 不含 RunInstances | auth-recovery/ram-bootstrap（+DescribeDisks 只读） | ✅ |

## 4. DoD Commands 复验

CMD-001 typecheck 0 error；CMD-002 lifecycle 48；CMD-003 manifest/help/completion 23；CMD-004 auth/ram 10；CMD-005 yaml valid。全绿。

## 5. Review QA Focus / 安全属性处理

- **verify 阶段 not-found 终态判定安全（最高危核对）**：`isNotFoundReadError` 正则 `/not exist|not found|notfound|不存在|未找到/i` 只命中真正 not-found。独立 reviewer 已交叉核对 `alicloud-error.ts` 的权限类（accessdenied/forbidden/no permission）与网络类（etimedout/connecttimeout/socket hang up）信号，均不含上述子串——权限/网络读取错误在 verify 阶段不会被误判为 notFound，会继续重试到 timedOut=true/notFound=false，**不谎报删除成功**。QA 采纳该 code-inspection 证据（真实构造 30s 超时用例成本过高，且属性为纯谓词逻辑可静态判定）。
- **deriveReleaseBehavior unknown 分支**：QA 已补 provider 单测（空盘 → releaseBehavior='unknown'；全 false → 'retained'；含 true → 'released'）。
- REV-001（delete 未传 force）：MVP 设计取舍，force optional 占位；非缺陷。
- REV-002（isNotFoundReadError 未复用 isNotFoundError）：当前正则更保守、安全侧正确；一致性建议留后续，非阻断。
- REV-003（删除保护阻断在 plan 构造前）：行为正确（先读 facts 判 deletionProtection 再构 plan），QA 确认无误。

## 6. 非功能验证

清洁度 scope-gate passed；Provider signals archguard/meta-cc 降级已记录（非代码缺陷）。

## 7. Residual Risks（非核心）

- 真实云 delete live 调用未做（会真实释放实例），核心由 mock/contract 证明。
- delete verify 权限/网络错误超时护栏无 30s 真实超时用例（谓词逻辑经 code-inspection 证明安全）；surface-harden 可评估是否加轻量注入式测试。

## 8. Verdict

**status: passed** — 核心路径 5 条 + D1-D10 全部有测试运行证据；最高危 not-found 终态判定安全属性经 code-inspection 确认；DoD core 全绿；review QA focus 处理完毕（deriveReleaseBehavior 补测）。无 failed/blocked。同意进入 acceptance。
