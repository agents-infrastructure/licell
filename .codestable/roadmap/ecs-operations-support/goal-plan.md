# ECS 操控能力支持 Goal 执行计划

## 1. Scope

- Roadmap: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md`
- Items: `.codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml`
- Goal state: `.codestable/roadmap/ecs-operations-support/goal-state.yaml`
- User confirmation: roadmap 已确认；7 份 child feature design 已统一确认并标记 `approved`。

本 goal 只负责执行已批准的 ECS read-only epic：交付 ECS provider 查询层、auth/RAM/doctor 只读权限、`licell ecs list/info`、filter 合同测试、命令面文档同步和后续 lifecycle 安全 seed。不得在 goal 执行中扩大已批准范围。

## 2. Feature Execution Order

| # | Roadmap item | Feature dir | Type | Deliverable |
|---|---|---|---|---|
| 1 | `ecs-readonly-provider` | `.codestable/features/2026-07-03-ecs-readonly-provider` | functional | ECS DescribeInstances provider 查询层、分页、过滤映射、summary/detail 白名单 |
| 2 | `ecs-auth-read-permissions` | `.codestable/features/2026-07-03-ecs-auth-read-permissions` | mixed | `AuthCapability='ecs'`、RAM Describe 权限、doctor optional probe |
| 3 | `ecs-list-command` | `.codestable/features/2026-07-03-ecs-list-command` | functional | `licell ecs list` 命令、INFRA section、JSON/text output、help/catalog metadata |
| 4 | `ecs-info-command` | `.codestable/features/2026-07-03-ecs-info-command` | functional | `licell ecs info <instanceId>` 命令、not_found/input 分类、detail 白名单 |
| 5 | `ecs-filter-contract-tests` | `.codestable/features/2026-07-03-ecs-filter-contract-tests` | non-functional | 过滤、错误分类、敏感字段和 JSON payload 防漂移测试 |
| 6 | `ecs-command-surface-docs` | `.codestable/features/2026-07-03-ecs-command-surface-docs` | mixed | README / agent surface / skill scaffold / completion 同步与 drift guard |
| 7 | `ecs-lifecycle-command-scaffold` | `.codestable/features/2026-07-03-ecs-lifecycle-command-scaffold` | non-functional | 后续 lifecycle command seed 与当前只读 surface/auth 负向 guard |

执行顺序遵守 items DAG。每个 feature accepted 后必须 scoped commit，且工作树干净后才进入下一条。

## 3. Roadmap Core Acceptance Paths

本 epic 的核心验收路径是 agent-facing ECS 查询闭环，不要求真实阿里云账号：

- Discovery path：`licell catalog --output json` 能发现 `ecs list` / `ecs info`，二者在 `Cloud Infrastructure` section，安全等级为 `safe`，preferred output 为 JSON。
- Help path：`licell ecs list --help --output json` 和 `licell ecs info --help --output json` 暴露参数、result fields、safe safety 和 option insights。
- Query path：mock ECS provider / SDK 后，`licell ecs list --output json` 输出 `@@LICELL_JSON@@` result，payload 包含 `regionId/count/limit/totalCount/truncated/filters/instances[]`。
- Detail path：mock ECS provider / SDK 后，`licell ecs info i-xxx --output json` 输出 `regionId/instanceId/detail.summary`，not-found 归类为 `not_found`。
- Auth path：bootstrap policy 含 ECS Describe action，doctor optional probe 只做 `listEcsInstances({ limit: 1 })`，权限不足为 warn 并建议 `licell auth repair`。
- Surface path：README generated block、`docs/reference/agent-surfaces.md`、skill scaffold 和 shell completion 与 registry 同源，不出现 lifecycle 半命令。

如果执行环境提供真实阿里云测试凭证，可以额外做只读 smoke；它不是本 goal 的核心通过条件，不能替代 mock/contract tests。

## 4. Key Assumptions

- 依赖可按 lockfile 恢复；`bun run typecheck` 是核心闸门，不能用“记录字段不可用”跳过。
- ECS SDK 字段存在性由 typecheck 证明；字段云端语义仍以 provider tests、mock characterization 和必要时后续 surface 修订处理。
- 第一阶段 ECS 命令只读，无 `.licell/project.json` 或 workspace state 写入。
- Lifecycle mutating actions 不进入当前 `CAPABILITY_ACTIONS.ecs` 或 bootstrap policy。
- generated docs 只通过 registry/descriptor 和 `bun run docs:sync` 更新。

## 5. Top Risks And Mitigation

| Risk | Mitigation |
|---|---|
| ECS SDK request/response 字段或 IP/name/tag 语义漂移。 | provider feature 先 typecheck；filter-contract-tests 锁定 request shape、no post-filter、敏感字段白名单；不可服务端表达的选项回设计调整，不做本地过滤伪装。 |
| 命令面 / docs / skill / completion 漂移。 | list/info descriptor 是事实源；command-surface-docs 运行 docs sync/check，并新增 committed skill drift guard。 |
| 只读 epic 被 lifecycle 半命令或 mutating RAM action 污染。 | auth feature 只加 Describe；lifecycle scaffold 写 seed 和负向 guard；catalog/help/docs/completion/RAM/auth tests 均断言无 start/stop/reboot/delete/run 当前 surface。 |

## 6. Mandatory Validation Commands

各 feature 必须执行其 checklist `dod.commands`。全局去重后的命令集合：

```bash
bun run typecheck
bun x vitest run src/__tests__/ecs-provider.test.ts
bun x vitest run src/__tests__/auth-recovery.test.ts src/__tests__/ram-bootstrap.test.ts src/__tests__/doctor-cloud.test.ts
bun x vitest run src/__tests__/doctor-cloud-integration.test.ts
bun x vitest run src/__tests__/ecs-command.test.ts
bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts
bun x vitest run src/__tests__/cli-help-json-contract.test.ts
bun x vitest run src/__tests__/cli-error.integration.test.ts src/__tests__/cli-help-json-contract.test.ts
bun x vitest run src/__tests__/command-reference.test.ts src/__tests__/readme-docs.test.ts src/__tests__/agent-surface-docs.test.ts src/__tests__/skills-scaffold.test.ts
bun x vitest run src/__tests__/shell-completion.test.ts
bun run docs:sync
bun run docs:check
python3 .codestable/tools/validate-yaml.py --file .codestable/roadmap/ecs-operations-support/ecs-operations-support-items.yaml --yaml-only
```

每个 feature checklist 自身的 YAML 校验也必须按对应 CMD 执行。

## 7. Final Aggregate Commands

roadmap 最终审计前必须重跑：

```bash
bun run typecheck
bun run test:ci
bun run docs:check
python3 .codestable/tools/codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/ecs-operations-support
```

若 `bun run test:ci` 因环境缺依赖而失败，恢复策略只能是恢复依赖 / lockfile / 既有 runner 配置；不得新增同名 shim 或伪造结果。若真实云凭证缺失，不阻塞本 roadmap，因为核心验收路径使用 mock/contract tests。

## 8. Preflight Strategy

- 每个 feature 实现前运行 worktree start gate，unit 指向当前 feature 目录。
- 每个 feature 先读取 design/checklist/design-review 和 `goal-features/<feature-slug>.md`。
- `ecs-readonly-provider` 首先确认依赖环境可 typecheck。
- docs feature 执行前确认 list/info descriptors 已落地；lifecycle scaffold 执行前确认 auth/filter/docs surface 已落地。
- 任何需要改变 approved design、roadmap item、公开 CLI contract 或权限边界的情况必须 `CS_ROADMAP_GOAL_HANDOFF`。

## 9. DoD Policy

- checklist steps 只能在实现阶段从 `pending` 改为 `done`。
- checklist checks 只能在 acceptance 阶段从 `pending` 改为 `passed`。
- core DoD command 失败为 fix-or-block，不能作为 residual risk 留给 acceptance。
- 每个 feature 必须有 implementation evidence、independent code review、QA report、acceptance report。
- acceptance 前必须 review passed 且无 unresolved blocking，QA passed 且无 unresolved failed/blocked。

## 10. Gate Policy

- 运行时权威入口：`.codestable/roadmap/ecs-operations-support/goal-protocol-gates.md`。
- implementation.before_review 必须运行 scope-gate、dod-runner、evidence-pack。
- review.before_pass 必须有独立 Task agent review；无法独立 review 且无用户降级授权时 handoff。
- qa.before_acceptance 必须覆盖 design scenarios、DoD commands、review QA focus、evidence residual risks。
- acceptance.before_done 必须确认 checklist checks 全 passed、roadmap item 回写、residual risk 无核心缺口。
- roadmap_audit.before_complete 必须运行 goal consistency gate 和 goal audit gate。

## 11. Provider Policy

- archguard / meta-cc / codebase memory 等 provider unavailable 不自动阻塞；必须在 review / QA / audit 中记录 fallback 与影响。
- provider warning 必须被 review / QA / audit 解释；未解释且影响核心路径时可以阻塞。
- 高风险代码事实优先用项目代码、tests、generated docs 和 command JSON 合同证明；不能只靠 H-only 判断完成核心验收。

## 12. Missing Validation Tool Recovery

验证工具缺失时只能：

- 恢复项目依赖或 lockfile；
- 修复既有 runner 配置；
- 运行已存在的 CodeStable tools；
- 在报告中解释非核心 provider unavailable。

禁止新增 `bun`、`vitest`、`jest`、`go`、`python` 等同名 shim，禁止把未运行的命令写成通过。

## 13. Final Audit Artifacts

最终审计会核验：

- 每个 feature 的 review / QA / acceptance；
- checklist steps 全 done、checks 全 passed；
- evidence pack、gate results、DoD command results；
- docs sync/check 输出；
- roadmap items 全 done 或 dropped；
- `.codestable/roadmap/ecs-operations-support/goal-audit.md`；
- goal-evidence-summary 或 goal-audit 第 7 节中的 provider warnings、E/C/H summary、H-only core checks。

最终审计必须运行：

```bash
python3 .codestable/tools/codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/ecs-operations-support
```
