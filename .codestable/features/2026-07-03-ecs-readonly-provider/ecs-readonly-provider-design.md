---
doc_type: feature-design
feature: 2026-07-03-ecs-readonly-provider
roadmap: ecs-operations-support
roadmap_item: ecs-readonly-provider
status: approved
summary: 新增 ECS 只读 provider 查询层，封装 DescribeInstances 分页、过滤映射、摘要归一化和基础详情读取
tags: [ecs, provider, alibaba-cloud, query]
---

# ecs-readonly-provider feature design

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| ECS Provider | Licell 内部封装 `@alicloud/ecs20140526` 的只读查询模块。 | 当前代码没有独立 `src/providers/ecs*`；`src/providers/vpc.ts` 只在默认网络编排中内部使用 ECS 安全组 API。 |
| `infra` provider | 当前 `src/providers/infra/*` 实际是 RDS 数据库 provider。 | 本 feature 不复用 `infra` 命名承载 ECS，避免把“基础设施”与现有 RDS provider 混淆。 |
| `EcsInstanceSummary` | Licell 稳定实例摘要类型，后续 CLI JSON payload 依赖它，而不是 SDK raw response。 | 新增术语；字段白名单来自 roadmap §4.1。 |
| provider filter | 传给 ECS `DescribeInstances` 的服务端过滤条件。 | 不做分页后本地过滤；SDK 字段不可表达时必须暴露为实现风险并回到 roadmap/后续 CLI surface 修订。 |

## 1. 决策与约束

### 需求摘要

本 feature 只交付 ECS provider 的最小只读闭环：

- `createEcsClient(regionId?)` 能按显式 region 或 Licell auth 默认 region 构造 ECS SDK client。
- `listEcsInstances(options)` 能调用 `DescribeInstances`，支持 roadmap 约定的基础 filters、分页上限和摘要归一化。
- `getEcsInstanceDetail(instanceId, options)` 能用 `DescribeInstances(instanceIds=[id])` 返回基础 detail；空结果抛出可被 `isNotFoundError()` 识别的 not-found 错误。
- provider 对外只返回 Licell domain type，不泄漏 SDK raw response，不返回敏感字段。

明确不做：

- 不注册 `licell ecs` 命令，不改 command registry、help、catalog、README 或 agent surface。
- 不新增 `AuthCapability='ecs'`、RAM policy action 或 doctor probe；这些属于 `ecs-auth-read-permissions`。
- 不创建、启动、停止、重启、删除或修改 ECS 实例，不调用 Cloud Assistant/VNC/console output/userData/password/key pair 私钥相关 API。
- 不写 `.licell/project.json`、`.licell/state.json` 或 workspace component 配置。
- 不做跨 region 自动搜索；未传 region 只使用当前 Licell auth region。

### 复杂度档位

走云资源 provider 默认档位：`Robustness=L3`、`Structure=modules`、`Performance=reasonable`、`Readability=team`、`Testability=tested`、`Security=validated`。

偏离对外服务默认：

- `Performance=reasonable`：只读查询最大 200/500 的受控分页，不设独立延迟预算。
- `Readability=team`：这是 CLI 内部 provider 契约，不作为公开 SDK 发布，但字段和错误语义要足够清楚供后续 command feature 消费。

### 关键决策

1. **新增 `src/providers/ecs/` 目录 + `src/providers/ecs.ts` facade**  
   现有 RDS/Redis/Supabase provider 已采用 `client.ts` / `query.ts` / `types.ts` + 顶层 facade 的模式。ECS 查询包含 client 构造、request builder、response normalization，直接放单个大文件会把 SDK 细节和 domain type 混在一起。

2. **provider public contract 先稳定，SDK 字段实现期校正**  
   Roadmap 已定义 `EcsInstanceFilters` / `EcsInstanceSummary` 等 Licell 类型；实现必须先检查已安装 `@alicloud/ecs20140526` 的 `.d.ts`，用 typecheck 锁定真实字段名。当前仓库没有 `node_modules`，因此 design 不把未过类型系统的 SDK 字段当作已证明事实。

3. **过滤只走 ECS 服务端可表达字段**  
   `instanceIds`、`name/namePrefix`、`status`、`zoneId`、`vpcId`、`vSwitchId`、`instanceType`、`chargeType`、`tags`、`privateIp/publicIp/eip` 都必须映射进 `DescribeInstancesRequest`。不得为了表面支持而在有限分页结果上本地过滤。

4. **详情存在性以 `DescribeInstances(instanceIds=[id])` 为准**  
   `DescribeInstanceAttribute` 不是基础 detail 的前置。第一版 detail 只包装 summary；空结果抛出 message/code 含 `not exist`、`notfound` 或 `no such` 的错误，保证 `output.ts` 能归类为 `not_found`。

5. **敏感字段白名单优先**  
   `summary/detail` 只输出 roadmap 白名单字段。即使 SDK response 含 userData、VNC、console output、password、key pair 等字段，也不得进入 provider 返回值。

### Top 3 风险与缓解

| 风险 | 缓解 |
|---|---|
| ECS SDK 字段名与文档/roadmap 预期不一致。 | Step 1 先做 SDK type precheck；`bun run typecheck` 是核心验证；字段不可用时停止扩大 help surface，回到 roadmap/后续 feature 调整。 |
| filter 看似支持但实际变成本地过滤。 | request builder tests 断言 SDK request shape；acceptance 反向核对不得出现 provider 分页后本地筛选。 |
| response shape 多层嵌套导致摘要字段漏映射或泄漏敏感字段。 | normalization tests 使用代表性 mock response；验收场景显式检查白名单字段和敏感字段缺席。 |

### 非显然依赖与关键假设

- 实现阶段需要可用依赖环境；若 `node_modules` 缺失，必须先按 lockfile 恢复依赖再运行 typecheck。`bun run typecheck` 是 core / fix-or-block，不能用“记录字段不可用”替代。
- `Config.requireAuth().region` 是默认 region 来源；本 feature 允许 options.regionId 覆盖它，但不修改全局 auth。
- 假设 ECS `DescribeInstances` 的 tag 和 IP filters 能由 SDK request model 表达；如果 typecheck 证明某项不可用，需要回到 `cs-epic` 更新 filter surface。
- ECS `publicIpAddresses` 字段存在不等于对 VPC 实例“公网入口”语义可靠；VPC 实例常见公网入口可能是 EIP/NAT。实现期如果发现 `--public-ip` 语义不可靠，后续 command feature 必须从 help/descriptor 移除或改文案，provider 不得用本地过滤制造精确查询错觉。

### 必跑验证命令

- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-provider.test.ts`
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only`

### 交付物与清洁度

交付物类别：

- ECS provider facade、client、query、types。
- `ecs-provider` 单元/characterization 测试。
- 本 feature 的 review、QA、acceptance 报告。

清洁度规则：

- 不新增临时 `console.log`、TODO/FIXME、注释掉的旧代码或未使用 import。
- 不把 mock-only 类型或测试替身导出到 production facade。
- 不在 provider 内写项目状态或命令文案。

## 2. 名词与编排

### 2.1 名词层

#### 现状

- `src/providers/vpc.ts` 已通过 `resolveSdkCtor()` 构造 `@alicloud/ecs20140526` client，endpoint 形态为 `ecs.${regionId}.aliyuncs.com`，但只服务 VPC 默认安全组编排。
- `src/providers/infra/query.ts`、`src/providers/redis/query.ts` 已有 list/detail 查询模式：分页受控、返回 Licell summary/detail 类型、SDK response 不直接外泄。
- 当前没有 `src/providers/ecs.ts`、`src/providers/ecs/` 或 ECS 实例 summary/detail 类型。

#### 变化

新增 ECS provider public contract：

```ts
import type Ecs from '@alicloud/ecs20140526';

export type EcsClient = Ecs;

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
```

接口示例：

```ts
// 来源：新增 src/providers/ecs/query.ts listEcsInstances
await listEcsInstances({
  regionId: 'cn-hangzhou',
  limit: 20,
  namePrefix: 'prod-',
  tags: [{ key: 'env', value: 'prod' }]
});
// => { regionId, filters, count, limit, truncated, instances: EcsInstanceSummary[] }

// 来源：新增 src/providers/ecs/query.ts getEcsInstanceDetail
await getEcsInstanceDetail('i-xxx', { regionId: 'cn-hangzhou' });
// => { summary }
// 空结果 => throw Error("ECS instance not exist: i-xxx")

// 来源：新增 src/providers/ecs/client.ts createEcsClient
const { regionId, client } = createEcsClient('cn-shanghai');
// => regionId = 'cn-shanghai', endpoint = ecs.cn-shanghai.aliyuncs.com
```

##### Filter mapping contract

实现必须先用 SDK `.d.ts` 校正最终字段名，目标语义如下：

| Licell filter | ECS request 语义 |
|---|---|
| `regionId` | `regionId`，必填 |
| `instanceIds[]` | JSON array string，最多按 SDK/接口限制传入；第一版不做批量拆分 |
| `name` | 透传 ECS `instanceName`，允许 ECS 原生通配 |
| `namePrefix` | 转成 `instanceName = "${prefix}*"`；同时出现 `name` 与 `namePrefix` 时 provider 也应报 input error |
| `status` | 原样传给 ECS 状态字段，不做别名/大小写归一 |
| `zoneId` / `vpcId` / `vSwitchId` / `instanceType` / `chargeType` | 分别映射到 `DescribeInstances` 对应服务端过滤字段 |
| `privateIpAddress` / `publicIpAddress` / `eipAddress` | 分别映射到 ECS 私网 IP、公网 IP、EIP 的服务端过滤字段；不可用时不得降级为本地过滤 |
| `tags[]` | 映射为 ECS tag filter，多个 tag 保持 AND 语义；保留 key/value，不拼进 name |

如果实现期确认 ECS `instanceName` 不支持 `prefix*` 通配，必须把风险传递给后续 command surface feature，调整 `--name-prefix` help/descriptor 语义或移除该入口；provider 不得用分页后本地过滤伪装前缀匹配。

##### Error token contract

- `getEcsInstanceDetail()` 空结果抛出的 `Error.message` 或 `Error.code` 必须包含 `not exist`、`notfound` 或 `no such` 之一，例如 `ECS instance not exist: i-xxx`，保证 `isNotFoundError()` 与 `output.ts` 能归类为 `not_found`。
- `name` 与 `namePrefix` 互斥、空 instanceId 等输入错误的 message 必须包含当前 `output.ts` 能识别的 input token，例如 `无效`、`不能为空`、`不支持` 或 `invalid`。互斥错误建议使用 `name 与 namePrefix 不能同时传入，过滤条件无效`。

##### Normalization source paths

实现期必须用真实 SDK 类型确认以下代表性路径，并用 mock response 锁定转换：

- rows: `body.instances?.instance || []`
- IDs/status/name: `instanceId`、`instanceName`、`status`
- region/zone/type/billing/os: `regionId`、`zoneId`、`instanceType`、`instanceChargeType`、`osName`
- VPC fields: `vpcAttributes.vpcId`、`vpcAttributes.vSwitchId`、`vpcAttributes.privateIpAddress.ipAddress[]`
- public IP fields: `publicIpAddress.ipAddress[]`
- EIP fields: `eipAddress.ipAddress`
- security groups: `securityGroupIds.securityGroupId[]`
- tags: `tags.tag[]` with SDK keys such as `tagKey` / `tagValue` mapped to Licell `{ key, value }`

##### Interface 设计检查

- Module：新增 `ECS Provider`，由 `src/providers/ecs.ts` facade 暴露。
- Interface：caller 主要使用 list/detail 的 domain contract；`createEcsClient()` / `EcsClientContext` 作为有意导出的低层 provider seam 暴露 SDK client 类型 `EcsClient = Ecs`，但 caller 不应依赖 SDK response shape、分页字段或 tag request model。只读安全边界由本 feature 的 scope、tests 和 code review 强制，`EcsClient` 类型本身不限制 future caller 调用 mutating SDK 方法。
- Seam：`listEcsInstances()` / `getEcsInstanceDetail()` 是后续 CLI、doctor probe 和测试共用 seam；测试通过 mock SDK client / request capture 观察行为。
- Depth / locality：SDK 字段、分页、过滤映射、summary normalization 都藏在 provider 内；删除 provider 后复杂度会散到 command、doctor 和 auth feature。
- Dependency strategy：true external；Alibaba Cloud ECS 是第三方云服务，测试不打真实云。
- Adapter：不引入独立 adapter。导出 `createEcsClient()` 是为现有 Licell provider 风格和测试 seam 服务；当前只有 production SDK client 和 test mock seam，额外 port 会变成薄间接层。
- Test surface：request builder/SDK mock 可覆盖过滤、分页、not-found、summary 白名单和无副作用。

### 2.2 编排层

#### 主流程图

```mermaid
flowchart TD
  A[future caller: command/doctor/test] --> B[listEcsInstances or getEcsInstanceDetail]
  B --> C[resolve region: options.regionId or Config.requireAuth().region]
  C --> D[create ECS client with ecs.region.aliyuncs.com]
  D --> E[build DescribeInstancesRequest]
  E --> F[call describeInstances page loop]
  F --> G[normalize SDK rows to EcsInstanceSummary]
  G --> H[return Licell domain result]
  F --> I{detail empty?}
  I -->|yes| J[throw not-found error]
  I -->|no| G
```

#### 现状

- RDS/Redis list 查询是线性分页拓扑：resolve auth/client → page loop → normalize rows → return summaries。
- `vpc.ts` 中 ECS client 构造散落在默认网络流程里，没有可复用 `createEcsClient()`。
- `output.ts` 的 `not_found` 分类依赖 `isNotFoundError()`，后者匹配 error text/code 中的 `notfound` / `not exist` / `404` 等关键词。

#### 变化

`listEcsInstances(options)`：

1. 归一化 `regionId` 与 `limit`：`options.regionId` 优先；否则 `Config.requireAuth().region`。provider 内部防御到 `1..500`。
2. 归一化 filters：trim 空字符串；`instanceIds` 去空去重；`name` 与 `namePrefix` 互斥且错误消息包含 `无效` 等 input token；tags 保留 key/value。
3. 构造 `DescribeInstancesRequest`：`pageSize = min(100, safeLimit)`，`pageNumber` 从 1 开始。
4. 最多 20 页；遇到空页、达到 `totalCount` 或达到 `safeLimit` 停止。
5. 返回 `{ regionId, filters, totalCount, count, limit, truncated, instances }`。`truncated=true` 表示云端 total 或分页结果超过本次 limit/页数上限。

`getEcsInstanceDetail(instanceId, options)`：

1. trim 并校验 `instanceId` 非空。
2. 调用 `listEcsInstances({ regionId, instanceIds: [instanceId], limit: 1 })` 或等价内部 query。
3. 空结果抛出 not-found，message/code 必须包含 `not exist` / `notfound` / `no such` token；非空返回 `{ summary }`。

#### 流程级约束

- 无副作用：不调用任何 mutating ECS API，不写本地项目状态。
- 错误语义：输入为空/互斥 filter 是 input error，错误消息必须含 `无效`、`不能为空`、`不支持` 或 `invalid` 等可分类 token；SDK auth/permission/network 错误原样抛给 CLI 层分类；空 detail 是 not-found，错误 message/code 必须含 `not exist` / `notfound` / `no such`。
- 幂等性：所有 provider 操作是只读，多次调用不会改变云端或本地状态。
- 顺序约束：分页必须按 pageNumber 顺序读取；达到 limit 后立即停止，不继续探测全量账号资源。
- 可观测点：实现证据主要来自 request capture tests、summary normalization tests、typecheck。

### 2.3 挂载点清单

- `src/providers/ecs.ts`：新增 ECS provider facade，后续 command/doctor 通过这里导入 `createEcsClient`、`listEcsInstances`、`getEcsInstanceDetail` 和 ECS domain types。
- `src/providers/ecs/types.ts` public exports：新增 `EcsClient` / `EcsClientContext` / `EcsInstanceSummary` / filters / result/detail 类型，作为后续 CLI JSON result descriptor 的来源。

不列入挂载点：

- `src/providers/ecs/client.ts`、`src/providers/ecs/query.ts`、测试文件属于内部实现/验证，不是用户或系统视角的注册点。
- command registry、docs、auth capability、doctor order 都不在本 feature 触碰。

### 2.4 推进策略

1. SDK/type precheck：按 lockfile 恢复依赖环境，并确认 `DescribeInstancesRequest` 和 response model 的真实字段名。  
   退出信号：`bun run typecheck` 真实通过，能校验 request builder 使用的字段；字段语义不可用只能触发 surface 修订，不能作为跳过 typecheck 的成功出口。
2. Provider skeleton：建立 client/types/query/facade 的最小结构。  
   退出信号：测试可导入 `listEcsInstances` / `getEcsInstanceDetail`，并能 mock client。
3. Filter request builder：实现 region/limit/filter 到 `DescribeInstancesRequest` 的映射。  
   退出信号：单测断言 instanceIds/name/namePrefix/status/vpc/vsw/zone/type/charge/tag/IP request shape；mock SDK 返回不匹配 filter 的实例时 provider 原样返回，证明没有 post-filter。
4. Pagination + summary normalization：实现受控分页和白名单摘要。  
   退出信号：单测覆盖多页、limit、truncated、空页、字段数组归一化和敏感字段缺席。
5. Detail + not-found：实现 `getEcsInstanceDetail()` 的存在性判断。  
   退出信号：单测覆盖 found、empty result not-found、空 instanceId input error，并断言 not-found message/code 可被 `isNotFoundError()` 识别且输出分类会进入 `not_found`。
6. Validation cleanup：跑必需验证并清理临时产物。  
   退出信号：typecheck、provider test、checklist yaml 校验通过，且 git diff 不包含 command/auth/docs 实现。

### 2.5 结构健康度与微重构

##### Compound 检索

`.codestable/compound/` 当前没有命中“目录 / 命名 / 归属 / composable / 组件”相关沉淀。

##### 评估

- 文件级 — `src/providers/vpc.ts`：283 行，内部已有 ECS client 构造，但职责是默认 VPC/VSwitch/SecurityGroup 编排；本 feature 不应把实例查询塞入该文件。
- 文件级 — `src/providers/infra/query.ts`：323 行，RDS 查询职责清楚；只作为模式参考，不修改。
- 文件级 — `src/providers/redis/query.ts`：335 行，Redis 查询职责清楚；只作为模式参考，不修改。
- 目录级 — `src/providers/`：顶层约 13 个文件，已有 `infra.ts` / `redis.ts` / `supabase.ts` facade + 子目录模式；新增 `ecs.ts` facade 符合现有模式。
- 目录级 — `src/providers/ecs/`：全新目录，计划落 `client.ts` / `query.ts` / `types.ts`，没有摊平风险。

##### 结论：不做微重构

本 feature 通过新 ECS provider 目录承载新能力，不改造现有 VPC/RDS/Redis provider。`vpc.ts` 里重复 ECS client 构造是后续可选提炼点，但如果现在抽共享 client 会改变现有默认网络路径的依赖形状，超出“只搬不改行为”的安全边界。

##### 超出范围的观察

- `src/providers/vpc.ts` 与新增 `src/providers/ecs/client.ts` 会短期各自构造 ECS SDK client。若后续 ECS 操控命令扩展出更多共享 client 配置，可另起 refactor 统一 ECS client factory；本 feature 不动现有 VPC 行为。
- `publicIpAddress` filter 对 VPC 实例公网入口可能语义有限；typecheck 只能证明字段存在，不能证明能命中 EIP/NAT 场景。若实现期发现该语义不可靠，必须把风险传递给后续 command surface feature，而不是在 provider 层用本地过滤补假精确。

## 3. 验收契约

### 3.1 关键场景清单

- S1 默认 region list：调用 `listEcsInstances({ limit: 2 })` 时，provider 使用 `Config.requireAuth().region` 构造 endpoint 和 request region。
- S2 显式 region list：调用 `listEcsInstances({ regionId: 'cn-shanghai' })` 时，request region 与 endpoint 使用显式 region，不修改全局 auth。
- S3 filter 映射：instanceIds、name、namePrefix、status、vpc、vsw、zone、instanceType、chargeType、tag、privateIp、publicIp、eip 均进入 `DescribeInstancesRequest`，且没有分页后本地过滤。
- S4 name 互斥：同时传 `name` 与 `namePrefix` 时抛 input error，错误消息包含 `无效` / `invalid` 等可分类 token。
- S5 分页上限：多页 response 在达到 `limit`、`totalCount`、空页或 20 页上限时停止，并正确设置 `count` / `limit` / `truncated`。
- S6 摘要白名单：SDK row 被归一化为 `EcsInstanceSummary`，数组字段为空时返回 `[]`，敏感字段不出现在返回对象。
- S7 detail found：`getEcsInstanceDetail('i-xxx')` 通过 instanceIds 查询并返回 `{ summary }`。
- S8 detail not found：空 `instances[]` 时抛出可被 `isNotFoundError()` 识别的 not-found 错误，错误 message/code 包含 `not exist` / `notfound` / `no such`。
- S9 无副作用：实现 diff 不包含 mutating ECS API 调用，不写 `.licell/project.json` / `.licell/state.json`。

### 3.2 明确不做的反向核对项

- 代码中不应注册 `ecs` CLI command 或修改 command registry。
- 代码中不应新增 `StartInstance`、`StopInstance`、`RebootInstance`、`DeleteInstance`、`RunInstances`、Cloud Assistant、VNC、console output、userData、password 或 key pair 私钥相关调用。
- provider 返回类型不应包含 `rawAttribute`、`userData`、`password`、`vncUrl`、`consoleOutput`、`keyPairPrivateKey` 等字段。
- 本 feature 不应修改 auth recovery、RAM policy、doctor capability order 或 generated docs。

### 3.3 Acceptance Coverage Matrix

| Scenario | Covered By Step | Evidence Type | Command / Action | Core? |
|---|---|---|---|---|
| S1 默认 region list | Step 2, Step 4 | unit test / request capture | `bun x vitest run src/__tests__/ecs-provider.test.ts` | yes |
| S2 显式 region list | Step 2, Step 4 | unit test / request capture | `bun x vitest run src/__tests__/ecs-provider.test.ts` | yes |
| S3 filter 映射 | Step 1, Step 3 | typecheck / unit test / negative test | `bun run typecheck`; provider test | yes |
| S4 name 互斥 | Step 3 | unit test | provider test | yes |
| S5 分页上限 | Step 4 | unit test | provider test | yes |
| S6 摘要白名单 | Step 4 | unit test / diff review | provider test; code review | yes |
| S7 detail found | Step 5 | unit test | provider test | yes |
| S8 detail not found | Step 5 | unit test | provider test + `isNotFoundError` / output category assertion | yes |
| S9 无副作用 | Step 6 | diff review / grep | code review / acceptance grep | yes |

### 3.4 DoD Contract

| ID | 要求 | 证据 | 阻塞级别 |
|---|---|---|---|
| DOD-DESIGN-001 | design/checklist 通过独立 design review，无 unresolved blocking | design-review report | blocking |
| DOD-IMPL-001 | checklist steps 全部完成，provider contract 与 roadmap §4.1 对齐 | checklist / implementation evidence | blocking |
| DOD-REVIEW-001 | code review passed 且无 unresolved blocking | feature review report | blocking |
| DOD-QA-001 | QA 覆盖 provider filter、pagination、summary、not-found 和无副作用 | QA report | blocking |
| DOD-ACCEPT-001 | acceptance 回写 roadmap item 状态并核验交付物 | acceptance report / items.yaml | blocking |

Validation Commands:

| ID | 命令 | 目的 | 核心性 | 失败处理 |
|---|---|---|---|---|
| CMD-001 | `bun run typecheck` | 验证 ECS SDK request/response 字段与 TypeScript 类型 | core | fix-or-block |
| CMD-002 | `bun x vitest run src/__tests__/ecs-provider.test.ts` | 验证 provider 行为合同 | core | fix-or-block |
| CMD-003 | `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-readonly-provider/ecs-readonly-provider-checklist.yaml --yaml-only` | 验证 checklist 可解析 | supporting | fix-or-block |

Required Artifacts: `ecs-readonly-provider-design-review.md`、实现后的 `ecs-readonly-provider-review.md`、`ecs-readonly-provider-qa.md`、`ecs-readonly-provider-acceptance.md`、相关命令输出证据。

## 4. 与项目级架构文档的关系

本 feature 新增的是资源级 provider 内部契约，不改变 Licell 主线 workflow 或外部命令 surface。acceptance 阶段无需立即写 ADR。

可沉淀候选：

- 若实现确认 ECS SDK 对 tag/name/IP filter 的字段映射存在坑，应通过 `cs-note` 写入 `.codestable/attention.md` 的“命令与脚本陷阱”或“其他”。
- 若后续多个 ECS feature 都复用相同 client factory，再另起 refactor/ADR 讨论 ECS client 构造归属；本 feature 只记录观察，不沉淀为稳定规则。
