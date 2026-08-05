---
epic: ../epics/command-region-overrides.md
phase: executing
approved_revision: 4e51507401b921732725f2f78388b214c6a69004e4b3530bf11512e6580f3c62
current_item: ITEM-3
next_action: 测试先行接入 Deploy、Task、Release、Function、Env 与 Domain 的 project-aware Region
blocked_by: null
item_progression: continuous
milestone_commit: authorized
remote_publish: manual
---

## 子项进度

- [x] ITEM-1
- [x] ITEM-2
- [ ] ITEM-3
- [ ] ITEM-4
- [ ] ITEM-5

## 临时决策与证据

- 2026-08-05：owner 确认“按推荐方案执行”；批准合同 revision `d9bd640ff7da14bcd9ad955f6a20c79052ca0ffb1f418e9014b7ebd27f2de6bc`，策略为 `continuous / authorized / manual`。
- 2026-08-05：命令 catalog 审计确认 59 个地域相关入口缺少 `--region`；OSS 17/17、ECS 7/7、logs 2/2 已覆盖，RDS 仅 `db info` 已覆盖。
- 2026-08-05：历史设计 `.codestable/roadmap/ecs-operations-support/ecs-operations-support-roadmap.md` 与 `.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md` 确立“显式覆盖 > auth 默认、不写回、不跨 region 搜索”的可复用先例。
- 2026-08-05：现状扫描确认 `project.region` 在 Deploy 主路径主要用于 plan/state 写回，FC/RDS/Redis/RDS AI 等 client 仍从 auth 默认地域构造。
- 2026-08-05：第一轮 design review 由 Paseo agent `2002dedf-90b4-4b9e-a5a2-c80e382b4160` 使用 `claude/claude-opus-5`、plan 模式、只读且无子 agent 完成；冻结 SHA-256 `97e328c0990ce1fffd38c655960ee4abf25811ac1a2c40707665033bf07436ac`，结论 `needs changes`，包含 B1-B5、I1-I6、N1-N4。
- 2026-08-05：修订版收敛 canonical project region，分离默认值与资源归属，新增 database/cache/supabase/network region binding，规定 RDS AI fail-fast 与 E2E `LICELL_CALL_REGION` 跨进程传播，并把 `deploy plan` 纳入缺口，总数由 59 个云端入口扩为 60 个表面。
- 2026-08-05：第二轮复审目标 SHA-256 `2d05a89b5ecfbfe47ab281e8b6db4487dea28244d410a8ff37120f81fd2ca78f`，同一 reviewer/lineage 结论 `needs changes`；60/87 计数通过，剩余 NB-1 至 NB-3 与 NI-1 至 NI-3。
- 2026-08-05：第三版明确 `ProjectSupabaseConfig`，统一资源命令优先级；依据阿里云官方 endpoint 表撤销错误的 RDS AI 全量 fail-fast；删除隐藏 env 传播，改为 registry-aware child argv 注入，并把 E2E home 刷新限定到每个顶层 run/cleanup 一次。
- 2026-08-05：第三轮审查目标 SHA-256 `a8fdceefd51477a9c692ee7e3a1a72c079d905437c4c0e5855e13c28d6d071f6`，同一 reviewer/lineage 结论 `needs changes`；design review 已达三轮上限，按 cs-epic 转 owner 裁决。
- 2026-08-05：裁决候选修正无参命令命中 binding，要求 `normalizeProject` 白名单保留四类 binding region，并选择 `.licell/state.json` 仅展示/审计、不参与命令路由；主流程通过阿里云官方 endpoint 页面与本地生成 SDK 双重核验 RDS AI 路由表。
- 2026-08-05：ITEM-1 第一轮 change review 由 Paseo agent `82ab7e7a-417b-46f3-8cb2-532a60ecdc10` 使用 `claude/claude-opus-5`、plan 模式只读完成；冻结 staged diff SHA-256 `2c03da2ef5536c32468892d1bad253ac1b16b45527bed1447d6e3e416143045e`，结论 `needs changes`，阻塞项为 binding region 被 `normalizeProject` 丢弃及测试绕过真实归一化路径。
- 2026-08-05：ITEM-1 修订显式归一化四类 binding region、增加无关项目写入往返回归、改用只读默认地域接口、按 scope 延迟读取项目、大小写敏感匹配 binding target，并补齐异步 CAC、显式覆盖、匹配/不匹配与 option target 测试；定向 85 tests 与 `bun run typecheck` 通过。Epic 澄清性修订 SHA-256 为 `4e51507401b921732725f2f78388b214c6a69004e4b3530bf11512e6580f3c62`，属于 owner 已批准推荐裁决的合同落字。
- 2026-08-05：ITEM-1 第二轮复审沿用 Paseo agent `82ab7e7a-417b-46f3-8cb2-532a60ecdc10`；冻结 SHA-256 `ab598ff28bc2a38288de96f86fc4b85955e81aded404ac452e4594e56b9eddee`，结论 `passed`、无 blocking。随后按唯一 important 建议补齐 `ensureAuthOrExit()` 覆盖 clone/不落盘测试，并允许未登录时的惰性默认 region 在登录后刷新；定向 86 tests、`bun run typecheck`、`bun run test:ci`、`bun run test:integration`、`bun run docs:check`、`bun run build` 均通过。
- 2026-08-05：ITEM-2 第一轮 change review 由 Paseo agent `9bf756f0-3880-41c2-886e-a545e07b5d46` 使用 `claude/claude-opus-5`、plan 模式只读完成；冻结 staged diff SHA-256 `c10401e4e556c5c7efc4c0496abe2aa1ba2f9c9f17445273c8eb8dae7f80c37b`，结论 `passed（有条件可合）`、无 blocking，提出 VPC 错误分类、命令合同、真实 helper/client 链路、Redis 非绑定轮换与生成文档等 7 项 important。
- 2026-08-05：ITEM-2 第二轮复审冻结 SHA-256 `0fd861d51caff7e56a4b676459fd0e9eaeca37be2e7a894c07eb02a62bc16fe5`，同一 reviewer 指出 cache 非绑定实例轮换后的命令输出仍错误宣称项目已更新，以及文档 Region 选项排序误伤非 regional 命令两项缺陷，结论 `needs changes`。
- 2026-08-05：ITEM-2 第三轮终审冻结 SHA-256 `4bf4305540e3e78bbae8bbbbecd75f1db94b4e28f20d5b4bbd4aa020ab6eb32d`，同一 reviewer/lineage 结论 `passed`、无 blocking/important；VPC 仅对确认 stale/not-found 回退，RDS/Redis 上下文到 SDK region capture、14 个 RDS AI endpoint、四类 binding 归一化、Redis 轮换持久化语义与 regional-only 文档排序均有回归守卫。`bun run typecheck`、`bun run docs:check`、`bun run build` 通过，`bun run test:integration` 7/7，`bun run test:ci` 144 files / 1052 tests 全绿。
