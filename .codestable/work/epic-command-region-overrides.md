---
epic: ../epics/command-region-overrides.md
phase: accepting
approved_revision: 4e51507401b921732725f2f78388b214c6a69004e4b3530bf11512e6580f3c62
current_item: FINAL-ACCEPTANCE
next_action: 由 fresh reviewer 按批准合同审查完整实现范围与最终验证证据
blocked_by: null
item_progression: continuous
milestone_commit: authorized
remote_publish: manual
---

## 子项进度

- [x] ITEM-1
- [x] ITEM-2
- [x] ITEM-3
- [x] ITEM-4
- [x] ITEM-5

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
- 2026-08-05：ITEM-3 第一轮 change review 由 Paseo agent `387fe01a-bf41-4183-a34e-c309e52c4aac` 使用 `claude/claude-opus-5`、plan 模式只读完成；冻结 staged diff SHA-256 `7028548b0d200bbabf9927726db72e1ec9787255514b23f2d06449ae2a5555ed`，结论 `needs changes`，指出已有跨地域 network binding 会绕过重新验证、缺少 project 无 region 回退、Env 写入提示及异构 workspace plan 的 `callRegionId` 语义问题。
- 2026-08-05：ITEM-3 第二轮复审冻结 SHA-256 `762d92f38f863b095697f95fb5079664768deafc929fec7411dae8155d7dd173`；B1/I1-I3 已核销，reviewer 在确认 `withProcessCwd(resolveDeployWorkingDirectory(ctx.component))` 后撤回 component 目录误判，剩余唯一 important 为已有 network binding 遇瞬时探测错误时不能静默降级公网。
- 2026-08-05：ITEM-3 第三轮终审冻结 SHA-256 `8aa2d7ea891524e42439a2c13a57d76f3da1d68c27660be63b0753471b6316f0`，同一 reviewer/lineage 结论 `passed`、无 blocking/important；已有 network binding 的 VPC 探测异常会终止部署，fresh 项目保留原有公网回退。Deploy/plan、Task、Release、Function、Env、Domain 共 30 个命令完成 project/auth scope 覆盖，项目默认值、有效调用值与 state 审计值保持分离。`bun run typecheck`、`bun run docs:check`、`bun run build` 通过，`bun run test:integration` 7/7，`bun run test:ci` 146 files / 1067 tests 全绿。
- 2026-08-05：ITEM-4 第一轮 change review 由 Paseo agent `5cf2bf4c-3651-462f-b962-ae484552ddc6` 使用 `claude/claude-opus-5`、plan 模式只读完成；冻结 staged diff SHA-256 `85408bb09648e4cb334c848a9688d9df42f3f479c4b6781bf063bd8ce0615a10`，结论 `needs changes`，生产地域语义通过但顶层 E2E home 生命周期和 auth export raw/effective 分离仅有 helper/mock 假绿。
- 2026-08-05：ITEM-4 第二轮复审冻结 SHA-256 `0c362ebee9cc63e60dcb6a8b1734e90ae2ca49d9232f216a7e22191af0da523e`，同一 reviewer 核销 B-1/B-2 及 I-1/I-3/I-4/I-5，结论 `approve`、无新增 blocking/important；真实 spawn runner、auto/standalone cleanup、真实 CAC auth export 加密包和 workspace doctor 聚合均有回归证据。
- 2026-08-05：ITEM-4 测试卫生修订后最终冻结 SHA-256 `d4382d9fadd6f34454c6d349d666031b4619867d93075b43fda8ede696c35e15`，同一 reviewer 第三轮极窄复核维持 `approve`；测试使用唯一 tmp basename、临时 HOME 与 partial child_process mock，不会触碰并发 E2E home 或本机 ACME。auth export、doctor/workspace doctor、E2E run/cleanup 共 5 个命令完成 scope 覆盖；`bun run typecheck`、`bun run docs:check`、`bun run build` 通过，`bun run test:integration` 7/7，`bun run test:ci` 149 files / 1080 tests 全绿。
- 2026-08-05：ITEM-5 第一轮 change review 由 Paseo agent `79772085-52f2-46c1-b4fd-b0eaae864a67` 使用 `claude/claude-opus-5`、plan 模式只读完成；冻结 staged diff SHA-256 `15bb9476d388c933558f4ccab3531660cbd96896ba1c9d431b1dd90fd6393fb8`，结论 `passed`、无 blocking，提出运行时行为证据、metadata 自洽守卫与 raw-auth 静态扫描 3 项 important。
- 2026-08-05：ITEM-5 第二轮复审冻结 SHA-256 `5c84ef676987e19b8bb161e1bf2fa59965b91c59a14b86f4e4c86f2fa496b196`，同一 reviewer/lineage 结论 `approve / passed`、无 blocking/important；OSS/ECS/logs 三族真实 CAC→ALS→provider→structured result 链路均 capture `cn-shanghai`，116 个命令完成 `87 regional + 5 default configuration + 24 explicit exclusion` 三态分类，17 处 raw `Config.getAuth()` 由静态基线守卫锁定。`bun run typecheck`、`bun run docs:check`、`bun run build` 通过，`bun run test:integration` 7/7，`bun run test:ci` 151 files / 1090 tests 全绿；里程碑 commit 为 `d1b77de`。
