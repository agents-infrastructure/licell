---
status: observed
scope: ECS / provider filters / result normalization
date: 2026-08-10
---
规则：扩展 ECS 查询时，过滤条件必须映射到 ECS 服务端 request，命令层不得对有限分页结果做本地补偿；provider 结果只返回 Licell 白名单字段，不泄露 SDK raw attribute，实例查询保持 region scoped。
适用 / 不适用：适用于 `ecs list/info` 及后续 ECS 查询；不适用于 ECS 生命周期写操作或不经过 ECS provider 的命令。
证据：`abfb671:.codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-design.md`；`src/providers/ecs/query.ts`；`src/__tests__/ecs-provider.test.ts`。
候选归宿：project-doc
