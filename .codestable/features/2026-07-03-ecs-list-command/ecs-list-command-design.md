---
doc_type: feature-design
feature: 2026-07-03-ecs-list-command
roadmap: ecs-operations-support
roadmap_item: ecs-list-command
status: approved
summary: 新增 licell ecs list 命令，暴露 ECS 只读实例列表查询、过滤参数和结构化 JSON result
tags: [ecs, cli, command-surface, list, agent-surface]
---

# ecs-list-command feature design

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| `ecs` namespace | 面向用户和 Agent 的 ECS 资源级命令族。 | 当前 registry 没有 `ecs` root；`src/providers/vpc.ts` 里的 ECS 只服务默认安全组编排，不是命令面。 |
| `ecs list` | 第一条用户可见 ECS 查询命令，返回当前 region 下受 filters 限定的 ECS 实例列表。 | 与 `db list` / `cache list` 同属资源级 inspect list 命令，但归入新的 Cloud Infrastructure section。 |
| `INFRA_SECTION` | 新增 command section，承载云服务器、网络与基础设施资源运维命令。 | 当前 `sections.ts` 只有 setup/delivery/data/automation；不把 ECS 塞进 Data Services。 |
| list filter parse | CLI options 到 provider `EcsListInstancesOptions` 的转换层。 | 不做云端结果本地过滤；命令层只做输入形态归一和互斥/格式校验。 |
| repeatable `--tag` | 用户可多次传入 `--tag key=value`，多个 tag 条件语义为 AND。 | `cac` 对重复 option 的运行时形态需要实现期测试锁定；命令层 helper 应接受 `string | string[] | undefined`。 |

## 1. 决策与约束

### 需求摘要

本 feature 交付 `licell ecs list` 的最小端到端查询命令：

- 新增 `ecs` command module 和 `INFRA_SECTION / Cloud Infrastructure`。
- 注册 `licell ecs list`，支持 roadmap 约定的 region、limit、name/name-prefix、tag、status、instance/network/IP 等过滤参数。
- 命令层调用 `listEcsInstances()`，并通过 `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })` 接入 ECS 权限修复。
- 文本输出供人类快速查看，JSON payload 保持 roadmap §4.2 的 `regionId/count/limit/totalCount/truncated/filters/instances[]` 结构。
- descriptor 提供 namespace/list 的 examples、agentTips、automation、optionInsights、result fields，让 catalog/help/json flow 能发现命令。

明确不做：

- 不实现或修改 ECS provider 查询逻辑；provider contract 来自 `ecs-readonly-provider`。
- 不修改 auth/RAM/doctor capability；权限 contract 来自 `ecs-auth-read-permissions`。
- 不注册 `licell ecs info`、start/stop/reboot/delete/rm/runInstances 等半成品命令。
- 不写 `.licell/project.json`、`.licell/state.json` 或 workspace component 配置。
- 不手改 README generated block 或 `docs/reference/agent-surfaces.md`；生成文档收口留给 `ecs-command-surface-docs`。
- 不做本地 post-filter；所有 filters 必须传给 provider，由 provider 映射到 ECS 服务端 request。

### 复杂度档位

走 CLI resource inspect 默认档位：`Robustness=L3`、`Structure=modules`、`Performance=reasonable`、`Readability=team`、`Testability=tested`、`Security=validated`。

偏离点：

- `Security=validated`：虽是只读命令，但会新增 agent-facing 命令面和 auth capability 消费，必须验证无副作用和 safe safety metadata。
- `Testability=tested`：参数组合多，必须用 command tests 锁定 parser → provider request 的 mapping。

### 关键决策

1. **本 feature 创建 `ecs` module，但只注册 `ecs list`**  
   `ecs info` 是下一条 roadmap item。提前注册 info 半成品会污染 help/catalog 和 docs；因此本 feature 的 namespace recommended flow 只能包含 list 和后续占位提示，不暴露不可执行命令。

2. **新增 `INFRA_SECTION` 并由 ECS module 首次拥有**  
   Section 定义放在 `src/commands/sections.ts`，ECS module 用同一个 exported const。后续基础设施命令复用该 section，避免 `section_inconsistent`。

3. **CLI 只做 parse，不做云端语义补偿**  
   `--name-prefix` 转 provider `namePrefix`，`--tag` 转 provider `tags[]`，IP filters 透传给 provider 对应字段。若 provider 实现期发现某 filter 不可表达，应回到 roadmap/command surface 调整，不在命令层伪装支持。

4. **`--limit` 对齐资源 list 命令：默认 20、最大 200**  
   命令层使用 `parseListLimit(options.limit, 20, 200)`，provider 内部仍可做更宽防御；JSON payload 回显最终 limit。

5. **输入错误要稳定归类为 input**  
   `--name` 与 `--name-prefix` 同时传入、非法 `--tag`、空 tag key 等错误 message 必须包含 `无效` / `不能为空` / `invalid` 等当前 `output.ts` 能识别的 token。

### Top 3 风险与缓解

| 风险 | 缓解 |
|---|---|
| 命令 surface 新增但 registry/help/catalog/docs 源头漂移。 | Step 1/5 覆盖 `collectCommandManifestIssues()`、catalog/help JSON tests；generated docs 不手改，后续 docs feature 统一 sync。 |
| 多 filters parse 漂移，尤其 repeatable `--tag`、`--name`/`--name-prefix` 互斥和 IP 三拆。 | Step 2 写参数 parser characterization，命令测试直接断言 provider 收到的 `EcsListInstancesOptions`。 |
| 命令意外写项目状态或扩大权限。 | Step 4/5 用 Config mock / diff review 断言不调用 `Config.setProject`，`requiredCapabilities` 仅 `['ecs']`，不出现 mutating ECS API 或 lifecycle command。 |

### 非显然依赖与关键假设

- 本 feature 实现依赖 `ecs-readonly-provider` 提供 `listEcsInstances(options)`，依赖 `ecs-auth-read-permissions` 提供 `AuthCapability='ecs'`；当前 epic 批量设计阶段只消费其合同，implementation 必须按 roadmap 依赖顺序执行。
- `cac` 对重复 `--tag` 的 runtime shape 需要用测试确认；实现 helper 必须兼容单值和数组。
- `--region` 是 provider option，不修改全局 auth region；未传时由 provider 使用 `Config.requireAuth().region`。
- `status` 只透传 ECS 原生值，不做大小写归一或中文别名。

### 必跑验证命令

- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-command.test.ts`
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts`
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts`
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-list-command/ecs-list-command-checklist.yaml --yaml-only`

### 交付物与清洁度

交付物类别：

- ECS command module、section、registry wiring。
- ECS list command tests、help/catalog/manifest tests 扩展。
- 本 feature 的 review、QA、acceptance 报告。

清洁度规则：

- 不新增临时 `console.log`、TODO/FIXME、注释掉代码或未使用 import。
- 不把 provider mock-only helper 导出到 production command surface。
- 不手改 generated docs。
- 不注册不可执行的 lifecycle 或 info 命令。

## 2. 名词与编排

### 2.1 名词层

#### 现状

- `src/commands/sections.ts:3-75` 只有 `SETUP_SECTION`、`DELIVERY_SECTION`、`DATA_SECTION`、`AUTOMATION_SECTION`。
- `src/commands/registry.ts:73-103` 显式列出所有 command module；当前没有 ECS module。
- `src/commands/db.ts:305-331` 和 `src/commands/cache.ts:350-375` 展示了资源 list 命令模式：`executeWithAuthRecovery()`、`ensureAuthOrExit()`、`parseListLimit(..., 20, 200)`、provider list、`emitCommandResult({ count, instances })`。
- `src/commands/module.ts:180-284` 会检查 root/descriptor/section 一致性；新增 section 或 module 不一致会触发 manifest issue。
- `src/utils/output.ts:795-810` 的 `emitCommandResult()` 负责统一 result record 包络，`src/utils/output.ts:726-728` 会把 command key 转成 stage，例如 `ecs.list`。

#### 变化

新增 section：

```ts
// 来源：src/commands/sections.ts
export const INFRA_SECTION: CommandSectionMembership = {
  id: 'infra',
  title: 'Cloud Infrastructure',
  summary: '云服务器、网络与基础设施资源的查询和运维命令。',
  taskHints: [
    {
      title: '查询云服务器资源',
      description: '先按 region 和 filters 查看 ECS 实例，再查看单台实例详情。',
      commands: ['licell ecs list --output json']
    }
  ]
};
```

新增命令：

```ts
// 来源：新增 src/commands/ecs.ts
const ecsListCommand = defineCliCommand({
  rawName: 'ecs list',
  description: '查看 ECS 实例列表',
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' },
    { rawName: '--limit <n>', description: '返回数量，默认 20，最大 200' },
    { rawName: '--status <status>', description: 'ECS 原生状态值，如 Running / Stopped' },
    { rawName: '--name <name>', description: '按 ECS InstanceName 过滤，支持 ECS 原生通配符' },
    { rawName: '--name-prefix <prefix>', description: '按实例名开头过滤，内部映射为 prefix*' },
    { rawName: '--instance-id <id>', description: '按实例 ID 过滤；可逗号分隔多个' },
    { rawName: '--vpc <vpcId>', description: '按 VPC ID 过滤' },
    { rawName: '--vsw <vSwitchId>', description: '按 VSwitch ID 过滤' },
    { rawName: '--zone <zoneId>', description: '按可用区过滤' },
    { rawName: '--instance-type <instanceType>', description: '按实例规格过滤' },
    { rawName: '--charge-type <chargeType>', description: '按付费类型过滤：PostPaid / PrePaid' },
    { rawName: '--tag <key=value>', description: '按标签精确过滤；可重复传入，多个 tag 为 AND' },
    { rawName: '--private-ip <ip>', description: '按私网 IP 过滤' },
    { rawName: '--public-ip <ip>', description: '按公网 IP 过滤' },
    { rawName: '--eip <ip>', description: '按 EIP 地址过滤' }
  ],
  descriptor: { ... }
});
```

Provider options mapping：

```ts
// 来源：新增 src/commands/ecs.ts parseEcsListOptions
{
  regionId,
  limit,
  status,
  name,
  namePrefix,
  instanceIds,
  vpcId,
  vSwitchId,
  zoneId,
  instanceType,
  chargeType,
  privateIpAddress,
  publicIpAddress,
  eipAddress,
  tags
}
```

JSON payload：

```json
{
  "regionId": "cn-hangzhou",
  "count": 1,
  "limit": 20,
  "totalCount": 1,
  "truncated": false,
  "filters": {
    "regionId": "cn-hangzhou",
    "status": "Running",
    "tags": [{ "key": "env", "value": "prod" }]
  },
  "instances": [
    {
      "instanceId": "i-xxx",
      "instanceName": "demo",
      "status": "Running",
      "regionId": "cn-hangzhou",
      "privateIpAddresses": ["10.0.0.1"],
      "publicIpAddresses": [],
      "securityGroupIds": [],
      "tags": [{ "key": "env", "value": "prod" }]
    }
  ]
}
```

Descriptor contract：

- Namespace `ecs`：summary、examples、agentTips、recommendedFlow；examples 只包含已注册可执行命令。
- Command `ecs list`：automation preferredOutput=json，safety level=safe，optionInsights 覆盖 `--region`、`--limit`、`--tag`、`--name`、`--name-prefix`、IP 三拆，result fields 覆盖 roadmap payload。

##### Interface 设计检查

- Module：新增 `ECS CLI Command` module，接入 command registry。
- Interface：用户/Agent 通过 `licell ecs list`、`catalog`、`--help --output json` 和 result payload 使用；caller 必须知道 filters 是服务端过滤请求，不是本地后筛。
- Seam：命令层 seam 是 `parseEcsListOptions()` 和 `listEcsInstances(options)`；测试 mock provider 观察最终 options。
- Depth / locality：CLI parse、help descriptor 和文本展示集中在 `src/commands/ecs.ts`；provider SDK 细节不进入 command。
- Dependency strategy：provider 是 local-substitutable for tests；ECS 云服务隐藏在 provider 后。
- Adapter：不新增 adapter。命令测试用 module mock `../providers/ecs`。
- Test surface：command tests 可覆盖参数映射、JSON result、auth capability、input error 和无状态写入；help/catalog tests 覆盖 agent surface。

### 2.2 编排层

#### 主流程图

```mermaid
flowchart TD
  A[user/agent: licell ecs list] --> B[executeWithAuthRecovery requiredCapabilities ecs]
  B --> C[ensureAuthOrExit]
  C --> D[parse limit default 20 max 200]
  D --> E[normalize filters]
  E --> F{name and namePrefix both set?}
  F -->|yes| G[input error: 过滤条件无效]
  F -->|no| H[provider listEcsInstances(options)]
  H --> I{--output json?}
  I -->|yes| J[emitCommandResult provider result]
  I -->|no| K[print compact table and empty state]
```

#### 现状

- list 命令模式分散在 `db.ts`、`cache.ts`、`fn.ts` 等文件，各自薄命令 + provider 调用。
- command registry metadata 是 help/catalog/docs 的源头；新增命令只改 source，不手改生成文档。

#### 变化

- `registerEcsCommands(cli)` 注册 `ecs list`。
- `ecsCommandModule` 使用 `INFRA_SECTION` 并加入 `LICELL_COMMAND_MANIFEST.modules`。
- `ecs list` 执行：
  1. `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })`
  2. `ensureAuthOrExit()`
  3. `parseEcsListOptions(options)`
  4. `withSpinner(..., () => listEcsInstances(providerOptions))`
  5. JSON 模式 `emitCommandResult(result)`
  6. 文本模式打印 `instanceId/name/status/type/zone/privateIp/publicIp/eip`

#### 流程级约束

- `--name` 与 `--name-prefix` 互斥；错误 message 含 `无效`。
- `--tag` 必须是 `key=value`，key 非空；value 允许空字符串只在 provider contract 允许时保留，否则报 input error。第一版推荐要求 `key=value` 且 value 非空，避免“仅 key 查询”超出 roadmap。
- `--instance-id` 支持逗号分隔列表，trim 后去空；不做批量拆分。
- `--status` 原样透传，不做别名、大小写归一或有效值枚举。
- `--private-ip`、`--public-ip`、`--eip` 三个独立字段；不新增模糊 `--ip`。
- JSON payload 应直接使用 provider `EcsListInstancesResult`，不在命令层删改 filters/instances 字段。
- 无副作用：不调用 `Config.setProject()` 或写工作区文件。

### 2.3 挂载点清单

- `src/commands/sections.ts`：新增 `INFRA_SECTION`。
- `src/commands/ecs.ts`：新增 `ecs` command module 与 `ecs list` command。
- `src/commands/registry.ts`：把 `ecsCommandModule` 加入 `LICELL_COMMAND_MANIFEST.modules`，插入位置必须在 `supaCommandModule` 之后、`doctorCommandModule` 之前，确保 `INFRA_SECTION` 在 generated command surface 中位于 `Data Services` 与 `Automation & Tooling` 之间。

不把 README、agent surface generated docs 或 shell completion 作为本 feature 的直接挂载点；这些由 command registry 派生，后续 `ecs-command-surface-docs` 统一 sync/check。

### 2.4 推进策略

1. Command skeleton：新增 section、ECS module、registry wiring，只注册 `ecs list`。  
   退出信号：`collectCommandManifestIssues(LICELL_COMMAND_MANIFEST)` 为空，catalog 能看到 `ecs list`，`ecsCommandModule` 位于 `supaCommandModule` 与 `doctorCommandModule` 之间，section 顺序为 data → infra → automation。
2. Parser contract：实现 `parseEcsListOptions()`。  
   退出信号：单测覆盖 region/limit/name/namePrefix/instanceIds/status/vpc/vsw/zone/type/charge/tag/IP 映射，互斥和非法 tag 报 input error。
3. Execution path：接通 auth recovery、provider、spinner、文本输出和 JSON result。  
   退出信号：命令测试 mock provider，断言 `requiredCapabilities: ['ecs']`、provider options、`emitCommandResult()` payload 和文本空态/列表输出。
4. Agent surface metadata：补 namespace/list descriptor。  
   退出信号：help/catalog metadata 测试能看到 automation preferredOutput=json、safe safety、result fields、optionInsights 和 examples。
5. Validation cleanup：运行验证并确认 scope 未漂移。  
   退出信号：typecheck、ecs-command test、manifest/help metadata tests、checklist yaml 校验通过，diff 不包含 docs generated 手改或 `ecs info` / lifecycle 命令注册。

### 2.5 结构健康度与微重构

`.codestable/compound/` 当前没有命中“目录 / 命名 / 归属 / composable / 组件”相关沉淀。

##### 评估

- 文件级 — `src/commands/sections.ts`：75 行，职责单一；新增一个 section 常量符合现有模式。
- 文件级 — `src/commands/registry.ts`：104 行，显式 import + modules 数组；新增 ECS module 是既有注册方式。
- 文件级 — 新增 `src/commands/ecs.ts`：全新命令模块，承载 ECS namespace/list parse/execute/descriptor。
- 目录级 — `src/commands/`：已有多个资源级命令文件；新增 `ecs.ts` 符合一命令族一文件模式，不需要目录重组。
- 测试级 — `src/__tests__/`：已有 `db-command.test.ts`、`cache-command.test.ts`、manifest/help tests；新增 `ecs-command.test.ts` 与现有模式一致。

##### 结论：不做微重构

新增命令族用新文件承载，触碰的现有文件都是注册表/section 小改。没有安全的“只搬不改行为”前置重构。

##### 超出范围的观察

- `db.ts` / `cache.ts` 的 list command descriptor 较薄，ECS 会更完整地声明 agent-facing result fields。是否回填旧命令 descriptor 属于后续 docs/command-surface 整理，不阻塞本 feature。

## 3. 验收契约

### 关键场景

- S1 command registry：`LICELL_COMMAND_MANIFEST` diagnostics 为空，catalog 出现 `ecs list`，section 为 `Cloud Infrastructure`。
- S1a section order：generated command surface 中 `Cloud Infrastructure` 位于 `Data Services` 与 `Automation & Tooling` 之间。
- S2 basic list：执行 `ecs list --region cn-hangzhou --limit 10 --output json`，provider 收到 `{ regionId: 'cn-hangzhou', limit: 10 }`，JSON payload 包含 provider result。
- S3 limit：未传 limit 使用 20，传入超大值被命令层限制为 200。
- S4 filters：status/name/namePrefix/instance-id/vpc/vsw/zone/instance-type/charge-type/private-ip/public-ip/eip 全部传到 provider 对应字段。
- S5 tag：重复 `--tag env=prod --tag owner=team-a` 转为 `tags: [{key:'env',value:'prod'}, {key:'owner',value:'team-a'}]`，语义保留为 AND。
- S6 invalid input：`--name` + `--name-prefix` 或非法 tag 触发 input error，错误 message 含 `无效` / `不能为空` / `invalid` 可分类 token。
- S7 auth：命令通过 `executeWithAuthRecovery()` 使用 `requiredCapabilities: ['ecs']`。
- S8 JSON/help：`ecs list --help --output json` 暴露 preferredOutput=json、safe safety、result fields 与 optionInsights。
- S9 no side effects：命令不写 `.licell/project.json` / `.licell/state.json`，不调用 mutating provider/API。
- S10 scope guard：不注册 `ecs info` 或 lifecycle 半成品命令，不手改 generated docs。

### Acceptance Coverage Matrix

| 场景 | Checklist step | 证据类型 | 核心 |
|---|---|---|---|
| S1 / S1a registry/section/catalog/order | Step 1 / Step 4 | unit test / manifest diagnostics / section order assertion | yes |
| S2 / S3 basic list + limit | Step 2 / Step 3 | command test / JSON payload | yes |
| S4 / S5 filters + tag | Step 2 | command test / provider mock | yes |
| S6 input errors | Step 2 | command test / error classification review | yes |
| S7 auth capability | Step 3 | command test | yes |
| S8 help JSON metadata | Step 4 | help JSON integration test | yes |
| S9 / S10 scope guard | Step 5 | diff review / validation output | yes |

### DoD Contract

| Gate | Contract |
|---|---|
| Design DoD | 本 design/checklist 通过独立 design-review；保持 draft，等待 epic 批量统一确认。 |
| Implementation DoD | `licell ecs list` 可执行，filters/auth/json/help metadata 全部按验收场景通过测试。 |
| Review DoD | 独立 code review 重点检查 command surface 漂移、parser edge case、auth capability、无副作用和未注册半成品命令。 |
| QA DoD | 跑 typecheck、ecs-command test、manifest/help metadata tests；如 help JSON 被触碰，跑 `cli-help-json-contract`。 |
| Acceptance DoD | 验收报告能从命令输出/测试/diff 证明 ECS list 已进入 catalog/help/json flow，且 generated docs 未手改。 |

Required artifacts：

- `ecs-list-command-review.md`
- `ecs-list-command-qa.md`
- `ecs-list-command-acceptance.md`
- 相关测试命令输出

## 4. 与项目级架构文档的关系

本 feature 改变 command registry 源头，但不直接同步生成文档。`ecs-command-surface-docs` 后续负责 `bun run docs:sync` / `docs:check`、README generated block 和 agent surface reference 收口。

若实现期发现某个 roadmap filter 不能由 provider 服务端表达，必须回到 `cs-epic` 更新 command surface 契约，不能在本 feature 里本地过滤伪装支持。
