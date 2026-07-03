---
doc_type: feature-design-review
feature: 2026-07-03-ecs-filter-contract-tests
status: passed
reviewed: 2026-07-03
round: 1
---

# ecs-filter-contract-tests feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-design.md`
- Checklist: `.codestable/features/2026-07-03-ecs-filter-contract-tests/ecs-filter-contract-tests-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Related docs: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`, 前置 `ecs-readonly-provider` / `ecs-list-command` / `ecs-info-command` design 与 review
- Code facts checked: `src/utils/output.ts`, `src/utils/alicloud-error.ts`, `src/__tests__/db-command.test.ts`, `src/__tests__/cli-error.integration.test.ts`, `src/__tests__/cli-help-json-contract.test.ts`

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `7281cee4-9749-4bca-91e8-d285f140f879`
- Raw output: 独立审查判定 passed，无 blocking；提出 2 条 important：CMD-002 未覆盖可选新增测试文件会假绿，敏感字段负向断言在 command 层不可证；另有私有 `detectErrorCategory` seam、Step 1 漏 `region`、publicIp/eip 与 provider 最终 surface 条件耦合等 nit/suggestion。
- Merge policy: 已逐条核验并收口。design/checklist 已固定不新增第三个 ECS 合同测试文件，CMD-002 只覆盖 `ecs-provider.test.ts` 与 `ecs-command.test.ts`；敏感字段证明点已移到 provider mock SDK response 注入 raw 字段；错误分类 seam 删除私有 `detectErrorCategory` 导入预期；Step 1 补 `region`；publicIp/eip/namePrefix 断言改为以 provider 最终 surface 为准。
- Gate effect: none

## 2. Design Summary

- Goal: 补强 ECS 查询过滤、错误分类和 JSON payload 合同测试，防止后续操控命令扩展时漂移。
- Key contracts: Provider 层锁定 SDK request shape 与 no post-filter；Command 层锁定 CLI options 到 provider options；JSON 层锁定 `ecs list/info` result/error record；敏感字段剥离由 provider normalization 证明。
- Steps: 5 步，风险热点是服务端过滤证明、repeatable tag parser、input/not-found category、payload 白名单和 scope 不越界。
- Checks: 覆盖不新增命令、不改 provider/auth/docs、过滤映射、错误分类、JSON payload、敏感字段剥离、验证命令不假绿。
- Baseline / validation: typecheck、ECS provider/command tests、CLI JSON tests、YAML 校验。

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- FDR-001 CMD-002 与“允许新增 `ecs-filter-contract.test.ts`”矛盾，可能导致核心 DoD 假绿：已收敛为不新增第三个 ECS 合同测试文件；若实现期确需新增，必须先改 checklist 的 CMD-002。
- FDR-002 敏感字段/白名单在 command JSON 层同义反复，不足以证明 provider 不泄漏 raw 字段：已把强证据改为 provider mock SDK response 注入 `rawAttribute/userData/vncUrl/consoleOutput/password/keyPairPrivateKey`，断言 normalization 后 summary/detail、JSON 与文本均不包含。

### nit

已处理：

- 私有 `detectErrorCategory()` 不再作为测试 seam；design 只要求通过 `emitCliError()` 或 CLI JSON record 观察 `error.category`。
- Step 1 退出信号已补 `region` request shape。

### suggestion

已处理：

- `publicIp/eip/namePrefix` 等依赖 ECS 服务端语义的断言已标注以 provider 最终 surface 为准；若前置 provider 删除或改名，本 feature 同步调整断言，不用本地 filtering 补偿。

### learning

- 防漂移测试需要同时证明“filter 进入 request”和“provider 没有 post-filter”。两者缺一都会留下假精确过滤的空间。
- 对 `output.ts` 这种私有分类函数，合同测试应观察公开 JSON record，而不是为测试导出内部 helper。

### praise

- 设计正确按 provider / command / CLI JSON 分层，不用一个巨型 e2e 承担所有语义。
- `cac` repeatable `--tag` 被列为 characterization 重点，能提前锁住项目内首次重复 option 的 runtime shape。
- scope guard 明确：只补测试，不新增用户命令、不改 auth/RAM/doctor、不打真实云。

## 4. User Review Focus

- 用户需要重点拍板：本 feature 只加强测试合同，不新增 ECS filter surface；若 provider 实现发现某 filter 不能服务端表达，后续要回到 provider/command design 调整 surface。
- implement 需要重点遵守：不新增 `ecs-filter-contract.test.ts` 除非同步 CMD-002；敏感字段强证据在 provider normalization；错误分类走公开 JSON record。
- code review / QA / acceptance 需要重点复核：测试是否真的捕获 SDK request shape、是否存在本地 filtering、是否有真实云依赖或 production scope 漂移。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design §3 覆盖 provider mapping/no post-filter、command parser、input/not-found、JSON payload、sensitive guard、no side effects | none |
| DoD Contract | pass | E | checklist `dod.commands` 覆盖 typecheck、两个 ECS test 文件、CLI JSON tests、YAML 校验；新增文件假绿风险已收口 | none |
| Steps and checks traceability | pass | E | steps/checks 均可解析，review findings 已回写 exit signal/checks | none |
| Roadmap contract compliance | pass | E/C | roadmap §4.1/§4.2 的 filters、error category、payload 和无副作用均有测试映射 | none |
| Module interface design | pass | E/C | design 明确 provider public seam、command provider mock seam、CLI JSON seam，不新增 production module | none |
| Validation and artifacts | pass | E | 必跑命令与后续 review/QA/acceptance artifacts 已列出，YAML 已通过校验 | none |

Summary: E=4, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- 前置 provider/list/info 代码尚未落地，当前测试文件也可能尚不存在；本 feature 实施必须排在前置 feature 之后。
- `publicIp/eip/namePrefix` 的云端真实语义仍以 provider 实现期 `.d.ts` / mock characterization / 必要实盘验证为准；本 feature 不用本地 filtering 掩盖不可表达的服务端 filter。

## 7. Verdict

- Status: passed
- Next: 保持 design 为 `draft`，交回 `cs-epic` 批量流程；等待所有 child feature design-review 通过后统一给用户确认。
