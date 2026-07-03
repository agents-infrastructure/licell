---
doc_type: roadmap
slug: ecs-operations-support
status: active
created: 2026-07-03
last_reviewed: 2026-07-03
tags: [ecs, alibaba-cloud, cli, agent-surface]
related_requirements: []
related_architecture: []
---

# ECS 操控能力支持

## 1. 背景

Licell 当前主线是 Alibaba Cloud 部署与运维 CLI，资源级命令已覆盖 FC、OSS、DNS、RDS、Redis、Supabase 等服务，但 ECS 只在 VPC provider 内部用于安全组编排，还没有面向用户和 Agent 的 `licell ecs ...` 命令面。

本 epic 的目标是给 Licell 增加 ECS 资源级操作能力，优先交付只读查询：按地域查询 ECS 实例列表、查看某台 ECS 的基本信息，并支持常用过滤条件。后续操控能力可以在同一命令族下继续扩展，但不能让高风险生命周期操作混入第一条查询闭环。

## 2. 范围与明确不做

### 本 roadmap 覆盖

- 新增 `ecs` 命令族，并把它接入共享命令注册表、catalog、`--help --output json`、README 与 agent surface 生成链路。
- 新增 ECS provider 查询层，封装 `@alicloud/ecs20140526` client、实例列表分页、过滤参数归一化和实例详情读取。
- 支持优先级最高的只读查询：`licell ecs list` 与 `licell ecs info <instanceId>`。
- 查询支持显式 `--region`，未传时使用 licell 全局 auth region；支持 `--limit`、`--status`、`--name`、`--name-prefix`、`--instance-id`、`--vpc`、`--vsw`、`--zone`、`--instance-type`、`--charge-type`、`--tag key=value`、`--private-ip`、`--public-ip`、`--eip` 等过滤入口。
- JSON 输出保持 Licell 统一 `@@LICELL_JSON@@` record 包络，业务 payload 明确区分 `instances[]`、`detail`、`filters`、`regionId`、`truncated` 等字段。
- 授权修复能力增加 ECS 查询所需最小 RAM action，避免 bootstrap 出来的 licell operator 无法执行只读 ECS 查询。
- 为后续 ECS start/stop/reboot/delete 等操控命令预留命令族结构、安全分级和测试扩展点。

### 明确不做

- 第一阶段不创建、删除、启动、停止、重启或变更 ECS 实例；这些是后续高影响 mutating/destructive feature。
- 第一阶段不做 Cloud Assistant 远程命令、VNC URL、磁盘/快照、镜像、安全组规则、EIP、ENI 等细分资源操作。
- 第一阶段不把 ECS 纳入 `deploy` 主线，不把 FC/OSS 应用自动部署到 ECS；本 epic 先作为资源级运维命令补齐。
- 第一阶段不维护 `.licell/project.json` 的 ECS 绑定状态；查询命令只读云端资源，不写项目状态。
- 第一阶段不做全量导出或自动翻完整账号；`ecs list` 只返回当前请求限定的前 N 条，默认 20、最大 200。
- 不手写生成文档区块；命令面变化必须先改 `src/commands/` 的 descriptor，再通过 `bun run docs:sync` 生成 README 与 agent surface。

### Granularity Gate

| 判断项 | 结论 |
|---|---|
| 为什么不是 single feature | 涉及 provider 查询层、命令注册/CLI UX、JSON/help/catalog 合同、RAM 权限、文档生成和后续生命周期扩展边界，至少需要多条可独立验证 feature。 |
| 为什么不是 brainstorm | 用户目标清楚：先支持 ECS 操控能力，最高优先级是按区域查询列表、基本信息和过滤查询；已有 Alibaba Cloud ECS skill 与 repo 命令模式可直接约束实现。 |
| roadmap 边界 | 本 epic 先交付 ECS 资源级命令族和只读查询闭环，并为后续操控命令预留安全边界。 |
| 最小闭环 | `ecs-readonly-provider` 完成后，代码层能够用 licell auth region 调 ECS `DescribeInstances` 并返回归一化实例摘要；这是 CLI 查询前的最窄云端读取闭环。 |

## 3. 模块拆分（概设）

```text
ECS 操控能力支持
├── ECS Provider：封装 ECS SDK client、分页、过滤、详情读取和结果归一化
├── ECS CLI Command：暴露 `licell ecs list/info`，处理参数、文本输出和 JSON payload
├── Command Surface & Docs：把命令 descriptor 接入 catalog/help/README/agent surfaces/skills/completion
└── Auth & Safety：补齐 RAM 查询权限，并为后续生命周期操作保留 safety 分级
```

### ECS Provider

- **职责**：在 `src/providers/ecs.ts` 或 `src/providers/ecs/` 下集中处理 ECS SDK client 构造、请求模型、分页上限、过滤参数映射、实例摘要/详情归一化。不处理 CLI 文案，不直接写 `.licell/project.json`。
- **承载的子 feature**：`ecs-readonly-provider`, `ecs-filter-contract-tests`, `ecs-lifecycle-command-scaffold`
- **触碰的现有代码 / 模块**：复用 `src/utils/sdk.ts` 的 `resolveSdkCtor()`；参考 `src/providers/vpc.ts` 中 ECS client endpoint 形态；参考 `src/providers/infra/query.ts`、`src/providers/redis/query.ts` 的查询/分页模式。
- **Depth 判断**：deep。复杂度集中在 SDK 字段差异、分页、过滤映射、tag/JSON 数组参数和返回字段归一化，CLI 只拿稳定 domain type。

### ECS CLI Command

- **职责**：在 `src/commands/ecs.ts` 注册 `ecs` 命令族，定义 `ecs list` 和 `ecs info <instanceId>` 的参数、descriptor、help、recommended flow、result 字段说明和人类文本输出。命令层负责 `ensureAuthOrExit()`、`executeWithAuthRecovery()`、`parseListLimit()`、`emitCommandResult()`。
- **承载的子 feature**：`ecs-list-command`, `ecs-info-command`, `ecs-filter-contract-tests`
- **触碰的现有代码 / 模块**：`src/commands/registry.ts`、`src/commands/sections.ts`、`src/utils/output.ts`、`src/utils/cli-shared.ts`、相近 `db`/`cache` 命令测试。
- **Depth 判断**：medium。命令层应该薄，但需要承载 CLI UX 和 agent-facing metadata。

### Command Surface & Docs

- **职责**：确保 `licell catalog --output json`、`licell ecs --help --output json`、`licell ecs list --help --output json`、README generated block、`docs/reference/agent-surfaces.md`、skills scaffold 和 shell completion 同源可发现。
- **承载的子 feature**：`ecs-command-surface-docs`
- **触碰的现有代码 / 模块**：`src/utils/command-catalog.ts`、`src/utils/agent-surface-docs.ts`、`src/utils/readme-docs.ts` 的现有生成链路通常不需要改，但必须通过生成和 drift 检查证明新命令进入文档。
- **Depth 判断**：deep enough。它不新增业务逻辑，但把命令 registry 作为单一事实源，避免手改文档造成漂移。

### Auth & Safety

- **职责**：把 ECS 查询纳入 Licell 授权修复能力，最小新增 `ecs:DescribeInstances`、`ecs:DescribeInstanceAttribute`，必要时后续 mutating feature 再按命令增加 `ecs:StartInstance` 等 action；同时为后续生命周期命令预留 safety descriptor 和显式确认规则。
- **承载的子 feature**：`ecs-auth-read-permissions`, `ecs-lifecycle-command-scaffold`
- **触碰的现有代码 / 模块**：`src/utils/auth-recovery.ts` 的 capability 枚举与 labels/actions，`src/providers/ram.ts` 的 `LICELL_POLICY_ACTIONS`，`src/providers/doctor-cloud.ts` 的 capability order/probe，auth/ram/doctor 相关测试。
- **Depth 判断**：deep。权限最小集和 safety metadata 是多个后续 ECS feature 的共同约束。

## 4. 模块间接口契约 / 共享协议（架构层详设）

### 4.1 ECS provider 查询接口

**方向**：ECS CLI Command → ECS Provider  
**形式**：TypeScript 函数调用

**契约**：

```ts
export interface EcsClientContext {
  regionId: string;
  client: EcsClient;
}

export interface EcsInstanceFilters {
  regionId?: string;
  instanceIds?: string[];
  name?: string;
  namePrefix?: string;
  status?: string;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
  instanceType?: string;
  chargeType?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  eipAddress?: string;
  tags?: Array<{ key: string; value?: string }>;
}

export interface EcsListInstancesOptions extends EcsInstanceFilters {
  limit?: number;
}

export interface EcsInstanceSummary {
  instanceId: string;
  instanceName?: string;
  status?: string;
  regionId: string;
  zoneId?: string;
  instanceType?: string;
  osName?: string;
  chargeType?: string;
  vpcId?: string;
  vSwitchId?: string;
  privateIpAddresses: string[];
  publicIpAddresses: string[];
  eipAddress?: string;
  securityGroupIds: string[];
  tags: Array<{ key: string; value?: string }>;
  createdAt?: string;
  expiredAt?: string;
}

export interface EcsListInstancesResult {
  regionId: string;
  filters: EcsInstanceFilters;
  totalCount?: number;
  count: number;
  limit: number;
  truncated: boolean;
  instances: EcsInstanceSummary[];
}

export interface EcsInstanceDetail {
  summary: EcsInstanceSummary;
}

export function createEcsClient(regionId?: string): EcsClientContext;
export function listEcsInstances(options?: EcsListInstancesOptions): Promise<EcsListInstancesResult>;
export function getEcsInstanceDetail(instanceId: string, options?: { regionId?: string }): Promise<EcsInstanceDetail>;
```

**约束**：

- `regionId` 解析顺序：显式 `--region` / `options.regionId` → `Config.requireAuth().region`；最终必须传给 ECS `DescribeInstancesRequest.regionId`。
- ECS endpoint 使用 `ecs.${regionId}.aliyuncs.com`，与 `src/providers/vpc.ts` 当前 ECS client 用法保持一致。
- `limit` 由命令层用 `parseListLimit(input, 20, 200)` 归一化，对齐现有资源 list 命令；provider 内部再做 1..500 防御，防止被绕过。
- provider 分页必须有上限，建议 pageSize `min(100, limit)`、最多 20 页，满足用户查询优先场景，避免 agent 无界遍历账号资源。
- `instanceIds` 传 ECS SDK 时使用 JSON array 字符串；`--instance-id` 支持单值或逗号分隔列表，provider 内统一成 `instanceIds[]`。
- `--status` 第一版只透传 ECS API 原生状态值，不做中文别名、大小写纠正或自定义状态归一化；命令层只做非空校验，非法状态由 ECS API 返回错误。
- `--tag` 只支持精确 `key=value` 格式；命令层需支持重复 `--tag key=value`，多个 tag 条件语义为 AND。第一版不支持仅 key 查询、模糊 value、OR 查询；格式不是 `key=value` 时直接报 input error。provider 映射到 SDK 支持的 tag/filter 结构时必须保留 key/value 语义，不把 tag 字符串拼进 name filter。
- IP 过滤不使用含糊 `--ip`。`--private-ip`、`--public-ip`、`--eip` 必须分别映射到 ECS `DescribeInstances` 可表达的私网、公网、EIP 查询参数；如果 feature-design/typecheck 发现某一类 SDK 参数不可用，必须从 help/descriptor 移除对应选项，而不是用有限分页后的客户端过滤伪装精确查询。
- `--name` 透传 ECS `InstanceName` 语义，允许用户传入 ECS API 支持的通配符；命令层不额外做模糊匹配。
- `--name-prefix <prefix>` 是面向常见“名字以 xx 开头”查询的人类友好入口，provider 内转成 ECS `InstanceName` 的 `prefix*` 模式；`--name` 和 `--name-prefix` 互斥，同时传入时报 input error。
- `getEcsInstanceDetail()` 最小可先用 `DescribeInstances` 按 instanceId 查询，若 SDK/权限允许再补 `DescribeInstanceAttribute` 的 raw 详情；缺少 attribute 不得让基础 info 失败，除非实例本身查不到。
- `ecs info <instanceId>` 未传 `--region` 时只查 Licell 当前默认 region，不跨所有 region 自动搜索；not-found 提示应引导用户确认 region 或显式传 `--region`。
- `getEcsInstanceDetail()` 以 `DescribeInstances(regionId, instanceIds=[id])` 的结果作为存在性判断；当返回空 `instances[]` 时，provider 必须抛出能被 `isNotFoundError()` 识别的错误，让 CLI JSON error category 归为 `not_found`。
- `ecs info` 第一版只返回基础信息白名单：instanceId、instanceName、status、regionId、zoneId、instanceType、osName、chargeType、vpcId、vSwitchId、securityGroupIds、privateIpAddresses、publicIpAddresses、eipAddress、tags、createdAt、expiredAt。
- 敏感字段不进入 `summary` 或 `detail`；不得返回 userData、VNC URL、Cloud Assistant 输出、启动命令输出、password、key pair 私钥材料等字段。如果后续 detail 要暴露诊断类字段，必须另起 feature 增加脱敏、权限和 safety 规则。

**Interface 设计检查**：

- Module / interface：ECS Provider 暴露稳定 Licell domain type，CLI 不直接依赖 SDK response shape。
- Seam placement：seam 放在 `listEcsInstances()` / `getEcsInstanceDetail()`；单元测试可以 mock provider，provider 测试可以 mock ECS client response。
- Depth / locality：SDK 字段名、分页规则、tag 映射和 endpoint 变化集中在 provider 内，命令/help/docs 不跟 SDK response 耦合。
- Dependency strategy：true external。ECS SDK 是第三方云服务依赖；测试应使用 mock adapter / vi mock，不打真实云。
- Adapter：第一阶段不需要抽象成多 provider adapter；`createEcsClient()` 是唯一 production 构造点，测试通过 mock module 或注入 client seam 覆盖。

### 4.2 ECS CLI 命令契约

**方向**：Human/Agent → ECS CLI Command → ECS Provider  
**形式**：CLI command + JSON result payload

**命令**：

```text
licell ecs list [--region <regionId>] [--limit <n>] [--status <status>] [--name <name>] [--name-prefix <prefix>]
                [--instance-id <id>] [--vpc <vpcId>] [--vsw <vSwitchId>] [--zone <zoneId>]
                [--instance-type <instanceType>] [--charge-type <PostPaid|PrePaid>] [--tag <key=value>]
                [--private-ip <ip>] [--public-ip <ip>] [--eip <ip>]

licell ecs info <instanceId> [--region <regionId>]
```

**JSON payload**：

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
      "zoneId": "cn-hangzhou-h",
      "instanceType": "ecs.g7.large",
      "privateIpAddresses": ["10.0.0.1"],
      "publicIpAddresses": [],
      "securityGroupIds": ["sg-xxx"],
      "tags": [{ "key": "env", "value": "prod" }]
    }
  ]
}
```

`ecs info` 的业务 payload：

```json
{
  "regionId": "cn-hangzhou",
  "instanceId": "i-xxx",
  "detail": {
    "summary": { "instanceId": "i-xxx", "regionId": "cn-hangzhou", "privateIpAddresses": [] }
  }
}
```

**约束**：

- JSON record 外层仍由 `emitCommandResult()` 产生 `kind=licell-cli-record`、`schemaVersion=1.0`、`type=result`、`command=ecs list|ecs info`。
- 文本输出必须只用于人类展示，不作为 agent contract；agent contract 以 help/catalog 的 result descriptor 与 JSON payload 为准。
- `ecs list` 是 inspect phase、安全等级 safe；`ecs info` 是 inspect phase、安全等级 safe。
- `ecs list/info` 必须是无副作用查询，不写入或修改 `.licell/project.json`、`.licell/state.json` 或 workspace component 配置。
- 过滤参数 parse 失败必须走 CLI error 包络，category 应归 input；云权限不足走 permission/auth recovery。

**Interface 设计检查**：

- Module / interface：CLI command 只暴露 Licell command contract，provider 返回稳定 result type。
- Seam placement：命令测试 mock `../providers/ecs`，验证参数传递、JSON payload、文本输出和 auth recovery capability。
- Depth / locality：help/catalog/docs 通过 descriptor 生成；不在文档里复制实现细节。
- Dependency strategy：local-substitutable for tests；true external hidden behind provider.
- Adapter：无独立 adapter。命令层通过 module mock 替代 provider 即可。

### 4.3 Auth capability 与 RAM policy 契约

**方向**：ECS CLI Command → Auth Recovery / RAM Bootstrap  
**形式**：TypeScript union + action list

**契约**：

```ts
// src/utils/auth-recovery.ts
export type AuthCapability =
  | 'fc' | 'dns' | 'oss' | 'rds' | 'rdsai' | 'redis' | 'cdn' | 'vpc' | 'cr' | 'logs'
  | 'ecs';

AUTH_CAPABILITY_LABELS.ecs = 'ECS';
CAPABILITY_ACTIONS.ecs = [
  'ecs:DescribeInstances',
  'ecs:DescribeInstanceAttribute'
];

// src/providers/ram.ts
LICELL_POLICY_ACTIONS includes:
'ecs:DescribeInstances',
'ecs:DescribeInstanceAttribute'

// src/providers/doctor-cloud.ts
DOCTOR_CAPABILITY_ORDER includes 'ecs';
CAPABILITY_PROBES.ecs calls listEcsInstances({ limit: 1 }) or an equivalent read probe;
```

**约束**：

- `ecs list/info` 的 `executeWithAuthRecovery()` 必须传 `requiredCapabilities: ['ecs']`。
- 第一阶段只新增 ECS 只读 Describe 权限，不把 `StartInstance`、`StopInstance`、`RebootInstance`、`DeleteInstance`、`RunInstances` 等 mutating action 加进默认 policy；即使生命周期命令尚未暴露，也不得提前扩大 bootstrap operator 的权限。后续操控 feature 再按命令和 safety 讨论最小权限。
- 现有 VPC 安全组使用的 `ecs:DescribeSecurityGroups` / `ecs:CreateSecurityGroup` 保留，不把它们替换为 ECS full access。
- 新增 `AuthCapability = 'ecs'` 后，`src/providers/doctor-cloud.ts` 中 `Record<AuthCapability, ...>` 必须同步新增 probe，否则 typecheck 会失败；doctor 输出应能显示 ECS 读权限状态。
- 本 roadmap 明确接受 ECS 进入全员 `licell doctor` optional 探测：由于当前 doctor 会对 `required + optional` capability 全部执行 probe，加入 `DOCTOR_CAPABILITY_ORDER` 后每次 doctor 会多一次 `listEcsInstances({ limit: 1 })` 等价只读云调用。该取舍用于提升诊断透明度；存量 bootstrap operator 在管理员重新 `licell auth repair` 前会看到 ECS 权限 warn，但不应阻断 doctor 整体结果。
- `ecs-auth-read-permissions` 必须测试 `AUTH_CAPABILITY_LABELS.ecs`、`CAPABILITY_ACTIONS.ecs`、RAM policy actions 与 doctor probe 均非空，避免新增 union 后出现 label/action 漂移。

**Interface 设计检查**：

- Module / interface：auth-recovery 通过 capability 把命令和最小 RAM action 解耦。
- Seam placement：seam 在 `requiredCapabilities` 和 `resolveAuthCapabilityActions()`；测试可以直接断言 actions。
- Depth / locality：新增 ECS 权限只需改 capability/action 列表，命令和 RAM policy 共享同一语义。
- Dependency strategy：in-process。
- Adapter：不适用。

### 4.4 命令 surface 生成契约

**方向**：ECS CLI Command descriptor → catalog/help/docs/skills/completion  
**形式**：共享命令 registry metadata

**契约**：

- 新增 `INFRA_SECTION`（建议 title: `Cloud Infrastructure`，summary: `云服务器、网络与基础设施资源的查询和运维命令。`），并用 `ecsCommandModule = defineCommandModule({ section: INFRA_SECTION, roots: ['ecs'], commands: [...] })` 注册 ECS 命令族。
- `INFRA_SECTION` 在生成文档中应位于 Data Services 与 Automation & Tooling 之间；若后续已有更合适的资源级 section，必须先更新本 roadmap 再改实现。
- `ecs` namespace descriptor 至少包含 summary、examples、agentTips、recommendedFlow。
- `ecs list` descriptor 至少包含 options、examples、automation.preferredOutput=json、result fields。
- `ecs info` descriptor 至少包含 argument hints、examples、automation.preferredOutput=json、result fields。

**约束**：

- 新命令必须加入 `LICELL_COMMAND_MANIFEST.modules`，并通过 `collectCommandManifestIssues()` 测试；新增 section 时同时检查 `section_inconsistent` 不出现。
- 文档通过 `bun run docs:sync` 生成，不手改 generated block。
- 帮助 JSON contract 测试要覆盖 `licell ecs list --help --output json` 能看到 result descriptor 和 option insights。

**Interface 设计检查**：

- Module / interface：registry 是单一事实源。
- Seam placement：docs sync 和 catalog/help 都从 registry 读取。
- Depth / locality：命令描述变化集中在 `src/commands/ecs.ts`。
- Dependency strategy：in-process。
- Adapter：不适用。

## 5. 子 feature 清单

1. **ecs-readonly-provider** — 新增 ECS provider 查询层，能够按 region/limit/基础 filters 调用 `DescribeInstances` 并返回归一化实例摘要。
   - 所属模块：ECS Provider
   - 依赖：无
   - 状态：done
   - 对应 feature：2026-07-03-ecs-readonly-provider
   - 备注：最小闭环；必须包含 SDK client 构造、分页上限、instanceId/name/namePrefix/status/vpc/vsw/zone/instanceType/charge/tag/privateIp/publicIp/eip 过滤映射的单元测试或 provider characterization 测试。

2. **ecs-auth-read-permissions** — 把 ECS 只读查询纳入 auth recovery capability、bootstrap RAM policy 和 doctor cloud capability probe，并增加缺失权限检查测试。
   - 所属模块：Auth & Safety
   - 依赖：ecs-readonly-provider
   - 状态：done
   - 对应 feature：2026-07-03-ecs-auth-read-permissions
   - 备注：先新增 `AuthCapability='ecs'`、`AUTH_CAPABILITY_LABELS.ecs`、`CAPABILITY_ACTIONS.ecs`、`LICELL_POLICY_ACTIONS` 和 doctor probe，供命令层消费；接受 ECS 进入全员 doctor optional 探测，每次 doctor 多一次 `limit=1` 只读云调用，存量 bootstrap operator 在重新 `auth repair` 前会出现 ECS 权限 warn；只加入 `DescribeInstances` / `DescribeInstanceAttribute`，不加入生命周期 mutating action。必须扩展 `auth-recovery` / `ram-bootstrap` / doctor 相关测试，并断言 label/actions/probe 非空。

3. **ecs-list-command** — 新增 `licell ecs list` 命令，把 provider 查询暴露为文本输出和结构化 JSON result。
   - 所属模块：ECS CLI Command
   - 依赖：ecs-readonly-provider, ecs-auth-read-permissions
   - 状态：done
   - 对应 feature：2026-07-03-ecs-list-command
   - 备注：负责创建/复用 `INFRA_SECTION` 并注册 `ecs` 命令族；必须验证 `--region` 覆盖 auth region、`--limit` 默认 20 / 上限 200、不做全量导出、`--status` 仅透传 ECS 原生值且不做别名/大小写归一、多个 `--tag key=value` 为 AND、非法 tag 格式报 input error、`--name-prefix` 转通配、`--name` 与 `--name-prefix` 互斥、`--private-ip` / `--public-ip` / `--eip`、`--output json` payload、auth recovery capability 和无副作用不写项目状态。

4. **ecs-info-command** — 新增 `licell ecs info <instanceId>` 命令，返回单台 ECS 的基础详情并处理 not found/input 错误。
   - 所属模块：ECS CLI Command, ECS Provider
   - 依赖：ecs-readonly-provider, ecs-auth-read-permissions
   - 状态：done
   - 对应 feature：2026-07-03-ecs-info-command
   - 备注：默认只查当前 Licell region，不跨 region 自动搜索；只返回本 roadmap 白名单中的基础字段；若 `DescribeInstanceAttribute` 不可用，仍应通过 `DescribeInstances(instanceIds=[id])` 返回基础 summary；不得返回 rawAttribute 或敏感诊断字段。空结果必须抛 not-found 错误并在 JSON error 中归类为 `not_found`；无副作用不写项目状态。

5. **ecs-filter-contract-tests** — 补强过滤与错误合同测试，锁定 tag/privateIp/publicIp/eip/name/namePrefix/status/region 参数映射、CLI input 错误分类和 JSON result 字段稳定性。
   - 所属模块：ECS Provider, ECS CLI Command
   - 依赖：ecs-list-command, ecs-info-command
   - 状态：planned
   - 对应 feature：未启动
   - 备注：这条不新增用户命令；目标是防止过滤支持在后续操控命令扩展时漂移。

6. **ecs-command-surface-docs** — 同步命令 metadata、README generated block、agent surface reference、skills scaffold 和 shell completion，证明 Agent 可按 catalog/help/json flow 发现 ECS 查询。
   - 所属模块：Command Surface & Docs
   - 依赖：ecs-list-command, ecs-info-command, ecs-auth-read-permissions
   - 状态：planned
   - 对应 feature：未启动
   - 备注：运行 `bun run docs:sync`、`bun run docs:check`，并覆盖 catalog/help JSON tests。手写 README 核心能力 bullet 属于 scope，生成块必须靠 docs sync。

7. **ecs-lifecycle-command-scaffold** — 为后续 start/stop/reboot/rm 等 ECS 操控命令补一层安全设计与空实现/设计占位，不开放实际 mutating 行为。
   - 所属模块：Auth & Safety, ECS CLI Command
   - 依赖：ecs-filter-contract-tests, ecs-command-surface-docs
   - 状态：planned
   - 对应 feature：未启动
   - 备注：产出可执行的后续 feature 种子或 design note，明确 safety level、confirm flags、dry-run 策略、RAM action 边界；不注册会误导用户的半成品命令。

**最小闭环**：第 1 条 `ecs-readonly-provider` 做完后，Licell 代码层已经能用 auth/region 调 ECS `DescribeInstances` 并拿到稳定 `EcsInstanceSummary[]`；第 3 条完成后用户和 Agent 可以执行 `licell ecs list --region cn-hangzhou --output json` 完成最窄端到端查询。

### Goal Coverage Matrix

| Goal / completion signal | Covered by item(s) | Verification entry | Evidence type | Core? |
|---|---|---|---|---|
| 用户能查询某个区域的 ECS 列表 | ecs-readonly-provider, ecs-list-command | `licell ecs list --region cn-hangzhou --output json`；provider/command tests | command result / unit test / acceptance report | yes |
| 用户能查看某台 ECS 的基本信息 | ecs-readonly-provider, ecs-info-command | `licell ecs info <instanceId> --region cn-hangzhou --output json`；not-found test | command result / unit test / acceptance report | yes |
| 查询支持可组合过滤条件 | ecs-readonly-provider, ecs-list-command, ecs-filter-contract-tests | command tests 覆盖 `--status`、`--tag`、`--name`、`--name-prefix`、`--private-ip`、`--public-ip`、`--eip`、`--vpc`、`--zone` 等参数映射 | unit test / JSON payload review | yes |
| Agent 能通过 catalog/help/json flow 发现并调用 ECS 查询 | ecs-command-surface-docs | `licell catalog --output json`、`licell ecs list --help --output json`、`bun run docs:check` | integration test / generated docs diff | yes |
| bootstrap/repair 后的 licell operator 有 ECS 查询权限，doctor 能探测 ECS 读权限 | ecs-auth-read-permissions | `resolveAuthCapabilityActions(['ecs'])` test；RAM policy actions test；doctor capability probe test/typecheck | unit test / typecheck | yes |
| 后续 ECS 操控命令不会和只读查询混在一起上线 | ecs-lifecycle-command-scaffold | design note / feature seed；command surface 不暴露未实现 mutating 命令 | diff review / acceptance report | no |

## 6. 排期思路

先做 provider 是因为它是所有 ECS 查询命令共用的边界，也能最早暴露 SDK 字段、分页和过滤映射风险。随后做 list/info 两条用户可见命令，形成完整查询闭环；再用 contract tests 锁住过滤和 JSON payload，避免后续命令扩展破坏 agent surface。授权和文档放在查询命令稳定之后收口，因为它们依赖最终 command key、result 字段和 capability 名称。生命周期 scaffold 放最后，只记录高风险操控的后续边界，不影响本轮查询优先交付。

Top 3 风险与缓解：

1. **SDK 字段与 ECS API 文档不完全一致**：provider feature 必须通过 typecheck 和 mock response characterization 校正字段，CLI 不直接依赖 raw SDK response。
2. **过滤支持表面过宽导致实现不准**：第一阶段只支持用户最常用且 `DescribeInstances` 能直接表达的过滤；其他过滤在 help 中不承诺，避免 agent 误用。
3. **命令面新增但 agent/docs 漂移**：所有 help/catalog/docs 由 command descriptor 生成；`ecs-command-surface-docs` 必须跑 docs sync/check 和相关 tests。

非显然依赖：

- 当前仓库没有 `node_modules`，后续实现必须安装/恢复依赖或使用现有 lockfile 环境跑 `bun run typecheck` 校验 SDK 类型。
- Licell auth 默认 region 在 `~/.licell-cli/auth.json`；ECS 查询必须允许 `--region` 覆盖，避免用户只能查默认区域。
- RAM bootstrap 当前 ECS 权限只覆盖安全组，查询能力必须补最小 Describe action。
- 存量 bootstrap operator 升级后不会自动获得新增 ECS Describe 权限；`ecs-auth-read-permissions` 验收必须覆盖并提示由管理员重新执行 `licell auth repair` 后再查询。
- ECS 加入 doctor optional probe 后，从未使用 ECS 的用户也会在 `licell doctor` 中多一次 ECS 只读探测；存量 bootstrap operator 未 re-repair 时会出现 ECS permission warn，属于已接受的诊断面扩张，不应升级为 doctor failure。

关键假设：

- 用户当前优先级是查询，不要求第一版实际操控 ECS 生命周期。
- `@alicloud/ecs20140526` 依赖已在 `package.json` 中，第一版不需要新增 npm dependency。
- ECS 查询属于资源级 diagnostics/ops 命令，暂不进入 `deploy` workflow。

基线与验证入口：

- 最小验证：新增/修改相关 `src/__tests__/ecs-*.test.ts`、`command-registry`/`command-surface` tests。
- 常规验证：`bun run typecheck`、相关 vitest 文件、`bun run docs:sync`、`bun run docs:check`。
- 若命令 help 集成被触碰：补跑 `bun run test:integration` 或至少 `src/__tests__/cli-help-json-contract.test.ts`。

交付物落点：

- Provider/type：`src/providers/ecs.ts` 或 `src/providers/ecs/*`。
- Command：`src/commands/ecs.ts`、`src/commands/registry.ts`、必要时 `src/commands/sections.ts`。
- Auth/RAM/Doctor：`src/utils/auth-recovery.ts`、`src/providers/ram.ts`、`src/providers/doctor-cloud.ts`。
- Tests：`src/__tests__/ecs-provider.test.ts`、`src/__tests__/ecs-command.test.ts`、现有 command/docs/auth tests 扩展。
- Docs/generated：README generated sections、`docs/reference/agent-surfaces.md`、skills scaffold snapshot/生成测试。

知识回写点：

- 若实现确认 ECS SDK 的 tag/name/namePrefix/privateIp/publicIp/eip/instanceIds 字段映射有坑，应在 acceptance 后通过 `cs-note` 写入 `.codestable/attention.md` 的“命令与脚本陷阱”或“其他”。
- 若最终决定生命周期命令的 safety/dry-run/confirm 策略，应在后续 feature acceptance 后触发 `cs-domain` 写 ADR 或 `cs-keep` 沉淀。

## 7. 观察项

- README 当前核心能力列表未提 ECS；等 `ecs-command-surface-docs` 落地后应由生成区块和必要手写简介共同体现，避免只在命令表里出现。
- `AuthCapability` 目前没有 `ecs`，但 `ram.ts` 已有 ECS security group actions，`doctor-cloud.ts` 的 `CAPABILITY_PROBES` 也是 `Record<AuthCapability, ...>`。新增 ECS 查询 capability 时要避免破坏 VPC 默认网络创建路径，并同步 doctor probe。
- 存量 bootstrap operator 需要管理员重新执行 `licell auth repair` 才能拿到新 ECS Describe 权限；命令错误的 `nextActions` 或文档应提示这一路径。
- ECS 进入 `DOCTOR_CAPABILITY_ORDER` 是主动产品取舍：换来 doctor 可见 ECS 读权限状态，代价是全员 doctor 多一次 optional 只读探测和旧 operator repair 前的 warn。
- 后续如果用户要求“操控”包含 start/stop/reboot/delete，必须单独审查费用、数据丢失、confirm flags、dry-run 与最小权限，不应复用只读查询 safety。
