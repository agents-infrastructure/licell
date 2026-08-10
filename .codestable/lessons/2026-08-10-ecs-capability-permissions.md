---
status: observed
scope: ECS / RAM capability / bootstrap policy / doctor probe
date: 2026-08-10
---
规则：新增 ECS action 时同时审查 capability preflight 与 bootstrap operator 的 `LICELL_POLICY_ACTIONS`；只读 capability 只含 Describe，生命周期权限按命令最小增加，doctor 的 ECS probe 保持 optional，权限不足时提示 `licell auth repair` 而不承诺自动修复。
适用 / 不适用：适用于 ECS 查询或生命周期命令引入新的 RAM action；不适用于无需阿里云凭证的本地命令。
证据：`abfb671:.codestable/features/2026-07-03-ecs-auth-read-permissions/ecs-auth-read-permissions-design.md`；`src/utils/auth-recovery.ts`；`src/__tests__/ram-bootstrap.test.ts`。
候选归宿：project-doc
