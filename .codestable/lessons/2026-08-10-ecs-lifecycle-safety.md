---
status: observed
scope: ECS / lifecycle / dry-run / destructive confirmation
date: 2026-08-10
---
规则：ECS 生命周期命令复用统一 plan/precheck/verify 编排并显式声明 safety；写操作提供机器可读 dry-run，stop 按高影响中断确认，delete/rm 在删除保护或关联资源事实不可读取时 fail closed，不能代用户关闭保护后继续执行。
适用 / 不适用：适用于 `ecs start/reboot/stop/delete/rm` 及后续 ECS 生命周期动作；只读查询不需要高影响或删除确认。
证据：`abfb671:.codestable/roadmap/ecs-lifecycle-operations/ecs-lifecycle-operations-roadmap.md`；`src/providers/ecs/lifecycle.ts`；`src/__tests__/ecs-lifecycle-command.test.ts`。
候选归宿：project-doc
