---
status: observed
scope: command metadata / generated docs / skills / completion / regression
date: 2026-08-10
---
规则：修改命令表面时先改 registry/descriptor，再同步生成文档，并分别验证 skill scaffold 与 shell completion；`docs:check` 只覆盖其声明的生成目标，不能替代 `bun run test:ci`，因为跨模块 surface guard 可能位于任务定向测试之外。
适用 / 不适用：适用于命令、选项、result descriptor、help/catalog、README、agent surface、skill 或 completion 变化；纯 provider 内部实现且无表面变化时不强制套用。
证据：`abfb671:.codestable/compound/2026-07-05-goal-machine-artifacts-and-full-regression.md`；`src/utils/agent-surface-docs.ts`；`src/__tests__/command-surface-metadata.test.ts`。
候选归宿：project-doc
