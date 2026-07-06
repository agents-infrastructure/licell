---
doc_type: feature-acceptance
feature: 2026-07-03-ecs-lifecycle-delete
status: passed
accepted: 2026-07-05
roadmap: ecs-lifecycle-operations
roadmap_item: ecs-lifecycle-delete
---

# ecs-lifecycle-delete 验收报告

## 1. 验收结论

**status: passed**。review passed（0 blocking）、QA passed（0 failed/blocked）、DoD core 全绿、checklist steps 全 done + checks 全 passed、roadmap item 回写。

## 2. 前置门校验

- review.before_pass：`ecs-lifecycle-delete-review.md` status=passed，reviewer=subagent，0 unresolved blocking；最高危 not-found 终态判定安全属性经 reviewer code-inspection 确认；`validate-implementation-review.py` ok=true。
- qa.before_acceptance：`ecs-lifecycle-delete-qa.md` status=passed，D1-D10 全覆盖，deriveReleaseBehavior 补测。
- implementation.before_review：scope-gate/dod-runner/dod-contract/evidence-pack 均 passed。

## 3. DoD Results 复核

CMD-001..005 全通过（typecheck 0 error、lifecycle 48、manifest/help/completion 23、auth/ram 10、yaml valid）。

## 4. 交付物

- `src/providers/ecs/lifecycle.ts`：`deleteEcsInstance`（DeleteInstance 单实例，force optional）、`getEcsInstanceReleaseFacts`（只读 DescribeInstances+DescribeDisks，不可读抛可分类错误）、`deriveReleaseBehavior`
- `src/providers/ecs/types.ts`：`EcsInstanceReleaseFacts`
- `src/commands/ecs-lifecycle.ts`：`ecs delete` / `ecs rm`（同 action 别名）+ `registerEcsDeleteAction`（releaseFacts 不可读阻断、deletionProtection 阻断、双确认、not-found 终态 verify）+ `pollForDeleteVerify` + `isNotFoundReadError`
- `src/commands/ecs.ts`：commands +delete/rm，namespace 文案覆盖完整生命周期
- `src/utils/auth-recovery.ts` / `src/providers/ram.ts`：+`ecs:DeleteInstance`、+只读 `ecs:DescribeDisks`
- 测试：`ecs-lifecycle-command.test.ts`（+delete D1-D8）、`ecs-lifecycle-provider.test.ts`（+delete/releaseFacts）；guard 更新

## 5. 回写处理

- roadmap item `ecs-lifecycle-delete` in-progress → done。
- generated docs 收口留给 surface-harden，本 feature 不手改、不跑 docs:sync。
- harness 对外契约未变（delete 用独立 pollForDeleteVerify，start/reboot/stop 零 diff）。

## 6. 安全设计确认

- 释放前事实不可读 → 阻断执行（RMR-001 决策1），不默认放行。
- deletionProtection=true → 阻断并提示先关保护，命令不代关。
- verify not-found = 删除终态成功；权限/网络错误不误判为 notFound（经 code-inspection 证明）。

## 7. Residual Risks（非核心）

- 真实云 delete live 调用未做；核心由 mock/contract 证明。
- delete verify 权限/网络超时护栏无 30s 真实用例（谓词逻辑经 code-inspection 证明安全）。

## 8. Verdict

验收通过。checklist checks 全 passed。可推进 feature 4（ecs-lifecycle-surface-harden 收口）。
