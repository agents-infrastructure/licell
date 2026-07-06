---
doc_type: feature-review
feature: 2026-07-03-ecs-lifecycle-delete
reviewer: subagent
status: passed
reviewed: 2026-07-05
---

# ecs-lifecycle-delete 独立代码审查

## 1. 范围与输入

只读审查，未改动任何代码。已读取：

- Design：`.codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-design.md`（第 3 节 D1-D10、决策 1 不可读即阻断、决策 2 deletionProtection 阻断、FDR-001 确认语义）
- Checklist：`.codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-checklist.yaml`
- Evidence pack：`.codestable/features/2026-07-03-ecs-lifecycle-delete/ecs-lifecycle-delete-evidence-pack.md`（DoD 5 命令全绿、scope-gate passed）
- 核心改动：`src/providers/ecs/lifecycle.ts`、`src/providers/ecs/types.ts`、`src/providers/ecs.ts`、`src/commands/ecs-lifecycle.ts`、`src/commands/ecs.ts`、`src/utils/auth-recovery.ts`、`src/providers/ram.ts`、`src/utils/cli-shared.ts`
- 关联只读：`src/providers/ecs/query.ts`、`src/utils/alicloud-error.ts`
- 测试：`src/__tests__/ecs-lifecycle-command.test.ts`、`ecs-lifecycle-provider.test.ts`、`auth-recovery.test.ts`、`ram-bootstrap.test.ts`、`shell-completion.test.ts`

delete 是本 roadmap 最高危、不可逆操作，按安全决策严格核对。

## 2. D1-D10 逐项核对

| # | 契约 | 结论 | 证据（文件:行） |
|---|---|---|---|
| D1 | dry-run willExecute=false、不调 DeleteInstance、plan.releaseFacts 有值 | PASS | `ecs-lifecycle.ts:512-532` dry-run 分支提前 return，`plan.releaseFacts` 在 `499-510` 构造；测试 `command.test.ts:680-693` |
| D2 | `--yes` 跳过交互、调 DeleteInstance、verify notFound=true | PASS | `ecs-lifecycle.ts:535-554`；verify `pollForDeleteVerify` not-found → `notFound/reachedTarget=true`（`112-114`）；测试 `command.test.ts:695-711` |
| D2b | 交互无 --yes 两次 prompt | PASS | `ensureDestructiveActionConfirmed`（`cli-shared.ts:198-219`）交互路径两次 `confirmPrompt`；命令传 `yes:false, interactiveTTY:true`（`535-538`）；测试 `command.test.ts:771-785` |
| D3 | 非交互无 --yes 抛错、不调 delete | PASS | `cli-shared.ts:204-206` 非交互无 yes 抛错；确认在 delete 之前（`535` 先于 `544`）；测试 `command.test.ts:713-728` |
| D4 | releaseFacts 不可读 → 阻断、不调 delete | PASS | `getEcsInstanceReleaseFacts` 读不到实例即抛（`lifecycle.ts:102-104`）；命令中位于确认与 delete 之前（`480-486`）；`withSpinner` 抛错向上传播；测试 `command.test.ts:730-745` |
| D5 | deletionProtection=true → 阻断、不调 delete | PASS | `ecs-lifecycle.ts:495-497` 在确认（535）与 delete（544）之前抛错；测试 `command.test.ts:747-769` |
| D6 | 确认文案含删除语义 | PASS | 文案 “…将删除云端资源，是否继续？” / “请再次确认：继续执行删除实例？”（`cli-shared.ts:214-217`，actionLabel=`删除实例`，`ecs-lifecycle.ts:535`） |
| D7 | 不存在实例 → not_found | PASS | `getEcsInstanceDetail` 抛 `ECS instance not exist`（`query.ts:197-199`），被分类为 `not_found/RESOURCE_NOT_FOUND`；测试 `command.test.ts:802-832` |
| D8 | rm 与 delete 同一 action、行为一致 | PASS | 两命令共用 `registerEcsDeleteAction` + `buildDeleteDescriptor`（`ecs-lifecycle.ts:426-446, 910-911`）；测试 `command.test.ts:787-800` |
| D9 | surface 暴露 start/reboot/stop/delete/rm、不暴露 run/create；delete.level=destructive、confirmFlags=['--yes'] | PASS | descriptor `safety.level='destructive'`、`confirmFlags:['--yes']`（`363-388`）；completion 断言 `shell-completion.test.ts:38-41`（含 delete/rm，排除 run/create） |
| D10 | RAM 含 DeleteInstance、不含 RunInstances | PASS | `LICELL_POLICY_ACTIONS` 加 `ecs:DeleteInstance`（`ram.ts:131`）、`CAPABILITY_ACTIONS.ecs` 加 `ecs:DeleteInstance`（`auth-recovery.ts:55`）；测试断言不含 `ecs:RunInstances`（`auth-recovery.test.ts:11-13,67-69`；`ram-bootstrap.test.ts:18`） |

## 3. 安全决策核对

### 3.1 阻断顺序（阻断必须先于确认与 delete）

命令执行顺序（`ecs-lifecycle.ts` registerEcsDeleteAction）：

1. `getEcsInstanceDetail`（466-472）— 不存在即抛 not_found，早于一切
2. `getEcsInstanceReleaseFacts`（480-486）— **不可读即抛，阻断（决策1）**
3. `deletionProtection===true` → 抛（495-497）— **阻断（决策2）**
4. dry-run 分支 return（512-532）
5. `ensureDestructiveActionConfirmed`（535-538）
6. `deleteEcsInstance`（544）

阻断（步骤 2、3）严格先于确认（5）与 delete（6）。两条阻断路径的测试均断言 `deleteEcsInstance` 与 `ensureDestructiveActionConfirmed` 都未被调用（`command.test.ts:742-743, 766-767`），符合 “信息缺失下绝不删除、命令不代关保护”。

### 3.2 事实不可读判定（决策1）

`getEcsInstanceReleaseFacts` 先 `DescribeInstances` 未查到行即抛可分类错误（`lifecycle.ts:101-104`），且此时 `DescribeDisks` 尚未调用（provider 测试 `provider.test.ts:291-297` 断言）。`DescribeInstances`/`DescribeDisks` 本身的权限或网络异常会作为未捕获错误向上抛出（wrapper 未 try/catch 吞错），同样触发阻断。默认放行被排除。

### 3.3 not-found 终态判定（决策2 / 重点第 5 点）

`pollForDeleteVerify`（`ecs-lifecycle.ts:93-129`）逻辑：

- 读到实例（未抛错）→ 继续轮询，最终 `timedOut:true, notFound:false`
- `getEcsInstanceDetail` 抛错时，仅当 `isNotFoundReadError(err)` 为真才返回 `notFound:true, reachedTarget:true`
- 其它错误（权限/网络）→ 落入 catch 但不返回终态，继续在有限窗口重试，超时后返回 `notFound:false, reachedTarget:false, timedOut:true`

`isNotFoundReadError`（`86-89`）正则 `/not exist|not found|notfound|不存在|未找到/i`。核对真实 not-found 信号 `ECS instance not exist:`（`query.ts:198`）能命中（`not exist`）。核对误判风险：`AccessDenied`/`Forbidden`/`no permission`（`alicloud-error.ts:48-52`）、超时/网络类 `ETIMEDOUT`/`connecttimeout`/`socket hang up`（`31-39`）均不含上述任一子串，不会命中，故**不会把权限/网络错误误判为删除成功**。结论：终态判定稳健，无谎报删除成功的风险。这是本次重点核对项，判定安全。

一处稳健性观察（non-blocking，见 REV-002）：正则用 message 子串匹配而非复用 `isNotFoundError`，与 codebase 既有分类工具轻微不一致，但更严格（`isNotFoundError` 额外含 `404`/`no such` 等，若复用反而略微放大命中面）；当前实现方向偏保守，安全侧正确。

### 3.4 deletionProtection 阻断（决策2）

`facts.deletionProtection === true` 严格等值判定（`495`），`undefined`（字段读不到）不会触发阻断——但字段读不到时实例行本身可读（`DescribeInstances` 返回了 row），属于信息可读但保护状态默认关闭的正常场景，`deletionProtection` 缺省按 ECS 语义即未开保护，行为合理。

## 4. 范围守护

- 未实现 run/create：provider barrel（`ecs.ts:18`）无 run/create wrapper；命令仅注册 start/reboot/stop/delete/rm（`ecs-lifecycle.ts:579-912`）。
- RAM 仅追加 `ecs:DeleteInstance` + 只读 `ecs:DescribeDisks`（`ram.ts:127,131`；`auth-recovery.ts:55`），不含 `RunInstances`，测试正向+反向断言齐全。
- harness 已冻结契约零改动：start/reboot/stop 三分支代码与确认 helper 选择（`ensureHighImpactActionConfirmed`）未变；delete 走独立 `registerEcsDeleteAction`，`pollForVerify` 原函数未改，delete 使用新增的 `pollForDeleteVerify`，互不干扰。
- generated docs 未手改：本 feature 改动集中在 `src/`（scope-gate `changed_files` 仅 src + 本 feature 目录），README/agent-surfaces 收口留给 surface-harden，符合 FDR-002。

## 5. Gate / Provider 警告

- DoD Runner：CMD-001~005 全部 exit_code=0（typecheck、ecs-lifecycle command+provider、manifest/help/completion、auth/ram、yaml 校验）。
- scope-gate：passed，无越界文件。
- archguard：available 但本轮未采集风险摘要（minimal 模式），仅 availability 提示，非 blocking。
- meta_cc：unavailable（实时会话采集超范围），非 blocking。

## 6. Findings

### Blocking

无。

### Non-blocking

- **REV-001**（`src/commands/ecs-lifecycle.ts:544` / `lifecycle.ts:59-76`）：命令层调用 `deleteEcsInstance` 未传 `force`。design 未要求 delete 默认强删，当前行为=ECS 默认（对 Running 实例可能因未强制而失败，交由 API 报错），符合 MVP “按 ECS 默认”。provider 已支持 `force` 参数，若后续需要对 Running 直接释放，可加 `--force` 开关。当前为设计内取舍，不阻断。
- **REV-002**（`src/commands/ecs-lifecycle.ts:86-89`）：`isNotFoundReadError` 用本地正则而非复用 `src/utils/alicloud-error.ts` 的 `isNotFoundError`。已核对当前正则在安全侧更保守（不会误判权限/网络为 not-found），功能正确；仅为一致性建议，可在 surface-harden 或后续微重构时统一。不阻断。
- **REV-003**（`src/commands/ecs-lifecycle.ts:494-497` vs `499-510`）：`deletionProtection` 阻断发生在 `plan` 对象构造之前，因此阻断时不产出 `plan`。行为符合 “先于确认阻断” 的要求；仅提示——阻断错误信息已足够明确（含 deletionProtection=true 与关保护指引），无需附带 plan。不阻断。

## 7. Test And QA Focus

- 已覆盖：D1（dry-run 不删+releaseFacts）、D2（--yes+notFound 终态）、D2b（交互双确认）、D3（非交互无 yes 抛错）、D4（事实不可读阻断且不确认不删）、D5（删除保护阻断）、D7（not_found 分类）、D8（rm≡delete）；provider 侧 DeleteInstance shape/force、releaseFacts released/retained 归纳、not-readable 抛错且不查 disks。
- 建议关注（非阻断，后续可补）：
  1. verify 阶段权限/网络错误场景的单测（断言 `notFound:false, timedOut:true`，锁死 “非 not-found 错误不谎报成功” 的回归护栏）——目前该路径仅靠代码审查覆盖，未有针对性测试。
  2. `deriveReleaseBehavior` 空盘（`disks.length===0`）→ `unknown` 与混合场景（部分 true 部分 false → `released`）的直接单测；当前经 released/retained 两例间接覆盖，`unknown` 分支未直测。

## 8. Verdict

status = **passed**（无 blocking）。

D1-D10 全部满足；三条安全决策（事实不可读阻断、deletionProtection 阻断、not-found 终态）均正确落地，阻断严格先于确认与 delete。重点核对的 `isNotFoundReadError` 判定稳健，不会把权限/网络错误误判为删除成功、不谎报释放终态。范围守护到位（未实现 run/create、RAM 仅加 DeleteInstance+DescribeDisks、harness 冻结契约零变化、未手改 generated docs）。清洁度合规（无 debug/TODO/注释代码/死 import）。3 条 non-blocking 建议与 2 项 QA 补测建议留待后续。
