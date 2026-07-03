---
doc_type: roadmap-review
roadmap: ecs-operations-support
status: passed
reviewed: 2026-07-03
round: 2
---

# ecs-operations-support roadmap 审查报告

## 1. Scope And Inputs

- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Items: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`
- Related docs: `README.md`, `docs/reference/agent-surfaces.md`, `.claude/skills/licell/SKILL.md`, `.claude/skills/alicloud-ecs/SKILL.md`, `.claude/skills/alicloud-ecs/references/instance.md`
- Code facts checked: `src/commands/registry.ts`, `src/commands/sections.ts`, `src/commands/db.ts`, `src/providers/vpc.ts`, `src/providers/ram.ts`, `src/providers/doctor-cloud.ts`, `src/utils/auth-recovery.ts`, `src/utils/output.ts`, `src/commands/module.ts`

### Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: `claude/opus`, agent `7738f7b1-224b-44c9-b06a-5788f3dac53b`
- Raw output: 独立 reviewer 返回 6 条 important、2 条 nit、2 条 suggestion、1 条 learning、3 条 praise、2 条 residual-risk。
- Merge policy: 已逐条核验；I1/I2/I3/I4/I5/I6 均已合并修复到 roadmap/items。
- Gate effect: none

### Round 2 Independent Review

- Status: completed
- Detection: paseo
- Provider / agent: agent `3bb5e492-1b01-4424-baed-5b5f9f17f183`
- Raw output: grill 后复审返回 2 条 important、2 条 nit、1 条 suggestion、2 条 residual-risk；无 blocking，总体仍可维持 `passed`。
- Merge policy: 已逐条核验；IMP-1 已回写 items notes，IMP-2 已在 roadmap §4.3/§6/§7 明确 doctor optional ECS 探测的产品取舍和存量 operator warn 影响。nit 已并入 items notes。
- Gate effect: none

## 2. Roadmap Summary

- Goal completion signal: 支持 `licell ecs list` 按 region 查询 ECS 列表、`licell ecs info <instanceId>` 查询基础信息，并支持明确过滤条件与 JSON 输出。
- Module split: ECS Provider、ECS CLI Command、Command Surface & Docs、Auth & Safety 四块职责清楚。
- Interface contracts: provider 类型、CLI 参数/JSON payload、auth capability/RAM policy、command surface 生成契约均已定义到 feature-design 可消费的粒度。
- Items: 7 条；`ecs-readonly-provider` 是最小闭环；auth capability 前置到 list/info 之前；items notes 已包含 grill 后收紧约束；DAG 无环。
- Dependency shape: DAG

## 3. Findings

### blocking

none

### important

none

已处理的 important：

- I1 `--ip` 过滤不可执行：已拆为 `--private-ip` / `--public-ip` / `--eip`，并要求 SDK 参数不可用时从 help 移除。
- I2 命令 section 未决：已拍板新增 `INFRA_SECTION`，并规定生成文档位置。
- I3 not-found 语义不明确：已要求 `getEcsInstanceDetail()` 在空 `instances[]` 时抛出可归类为 `not_found` 的错误。
- I4 存量 bootstrap operator 迁移未点名：已加入非显然依赖、观察项和 auth feature 验收。
- I5 auth capability 依赖方向反了：已把 `ecs-auth-read-permissions` 前移到 list/info 前。
- I6 `--limit` 上限不一致：已把命令层对齐为 `parseListLimit(input, 20, 200)`。
- IMP-1 items notes 落后于 grill 后约束：已补充 `--status` 仅透传 ECS 原生值、`ecs info` 默认只查当前 region、只返回基础字段白名单、无副作用不写项目状态。
- IMP-2 doctor 探测面扩张需拍板：已明确接受 ECS 进入全员 doctor optional 探测，每次 doctor 多一次 `limit=1` 只读云调用；存量 bootstrap operator 在重新 `auth repair` 前会出现 ECS 权限 warn，但不阻断 doctor。

### nit

none

已处理的 nit：

- README 手写核心能力 bullet 属于 scope，但 generated block 必须 docs sync。
- ECS client 构造明确 mirror `src/providers/vpc.ts` 的 `@alicloud/openapi-client` + `resolveSdkCtor` 模式。
- `INFRA_SECTION` 创建归属已写入 `ecs-list-command` notes，避免命令 surface 实现时 section 所属漂移。
- 无副作用不写项目状态已写入 `ecs-list-command` / `ecs-info-command` notes。

### suggestion

- [ ] RMR-001 `roadmap §4.1` 后续 feature-design 仍需用实际 SDK 类型确认 `DescribeInstances` 对 `InstanceName` 通配符、`namePrefix -> prefix*` 转换、私网/公网/EIP 参数名的精确字段。

### learning

- bootstrap 凭证对 capability preflight 有短路，新增 ECS 权限真正落地依赖 `LICELL_POLICY_ACTIONS` 和管理员重新 `auth repair`，该点已写入 roadmap。

### praise

- 最小闭环拆在 provider 层，后续 CLI 端到端闭环明确。
- 生命周期操控没有混进只读查询首版，安全边界清楚。
- 命令 surface 和 docs 生成纪律被纳入独立 feature。

## 4. User Review Focus

- 用户已拍板：新增 `Cloud Infrastructure` section 承载 ECS；第一版只做只读查询；支持 tag 精确过滤、ECS name 通配和 `--name-prefix`；接受 ECS 进入 doctor optional 探测及其旧 operator warn 影响。
- 后续 feature-design 需要重点复核：ECS SDK 过滤字段名、`--name-prefix` 与 `--name` 互斥校验、not-found 错误构造、存量 bootstrap operator 的 repair 提示、doctor probe warn 文案。
- 不能靠 roadmap review 完全确认的点：当前仓库无 `node_modules`，具体 SDK 类型需在实现阶段通过依赖恢复后的 `bun run typecheck` 校正。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Granularity Gate | pass | E | roadmap §2 写明多模块、多合同、多阶段验证 | none |
| Goal Coverage Matrix | pass | E | roadmap §5 每个核心完成信号均映射 item 和验证入口 | none |
| DAG and minimal loop | pass | E | items.yaml 校验通过；本地 DAG 检查无环；仅 `ecs-readonly-provider` 标 minimal_loop；grill 后 notes 不改变依赖图 | none |
| Interface contract usability | pass | E/C | roadmap §4 定义 provider/CLI/auth/surface 契约；代码事实核验现有 registry/output/auth 模式 | SDK 字段实现期 typecheck |
| Module interface depth | pass | C | provider seam 集中 SDK 分页/过滤/归一化，CLI 不直接依赖 SDK response | none |

Summary: E=3, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- ECS SDK 具体字段在本机无 `node_modules` 环境下未能通过类型系统验证；后续实现必须恢复依赖并跑 `bun run typecheck`。
- 深分页后续如果超过 200/500 需要重新设计分页策略；当前查询优先范围内可接受。
- ECS 加入 doctor optional probe 后会增加一次只读云调用；旧 bootstrap operator 在管理员重新 `auth repair` 前会看到 ECS permission warn。该风险已作为产品取舍写入 roadmap，后续实现需确保 warn 不升级为 failure。

## 7. Verdict

- Status: passed
- Next: roadmap 已可保持 `active`；下一步进入子 feature design / goal-package，不在本 gate 启动实现。
