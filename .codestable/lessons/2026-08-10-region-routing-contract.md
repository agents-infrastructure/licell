---
status: observed
scope: region / command metadata / provider routing / resource binding
date: 2026-08-10
---
规则：新增地域相关命令或 provider 时，必须区分本次调用地域、项目默认地域和资源归属地域；命令通过 registry metadata 声明 `auth | binding | project | manifest` scope，调用覆盖不得写回 auth 或项目默认值，资源归属只写入匹配的 binding、state 或 manifest。
适用 / 不适用：适用于所有会选择阿里云地域的 CLI、provider、部署与 E2E 子进程；不适用于本地命令、全局 endpoint 服务，以及明确写入默认地域的配置命令。
证据：`abfb671:.codestable/epics/command-region-overrides.md`；`src/commands/module.ts`；`src/__tests__/regional-surface-contract.test.ts`。
候选归宿：adr
