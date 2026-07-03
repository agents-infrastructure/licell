---
doc_type: feature-design
feature: 2026-07-03-ecs-info-command
roadmap: ecs-operations-support
roadmap_item: ecs-info-command
status: approved
summary: 新增 licell ecs info 命令，按当前或显式 region 查询单台 ECS 基础详情并稳定处理 not-found
tags: [ecs, cli, info, not-found, agent-surface]
---

# ecs-info-command feature design

## 0. 术语约定

| 术语 | 定义 | 防冲突结论 |
|---|---|---|
| `ecs info` | 面向用户和 Agent 的单台 ECS 基础详情查询命令。 | 与 `ecs list` 同属 ECS inspect 命令族；本 feature 只新增 info 子命令，不改 list 行为。 |
| 基础详情 | `getEcsInstanceDetail()` 返回的 `{ summary }`，字段来自 roadmap 白名单。 | 第一版不暴露 SDK raw attribute、诊断输出、VNC、Cloud Assistant、userData 或密钥材料。 |
| 当前 region | Licell auth 默认 region，即 provider 在未传 `regionId` 时使用 `Config.requireAuth().region`。 | `ecs info` 默认只查当前 region，不跨 region 自动搜索。 |
| not-found 合同 | 实例不存在或 region 不匹配时，CLI JSON error 归类为 `not_found`。 | 依赖 provider 抛出含 `not exist` / `notfound` / `no such` token 的错误；命令层不得吞掉或改写成 internal。 |

## 1. 决策与约束

### 需求摘要

本 feature 交付 `licell ecs info <instanceId>` 的只读查询命令：

- 在前置 `ecs` command module 中注册 `ecs info <instanceId>`。
- 支持 `--region <regionId>` 覆盖当前 Licell auth region；未传时只查当前 region。
- 命令层调用 `getEcsInstanceDetail(instanceId, { regionId })`，并通过 `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })` 接入权限修复。
- JSON payload 固定为 `{ regionId, instanceId, detail }`，其中 `detail.summary` 只包含 roadmap 白名单基础字段。
- not-found、空 instanceId、权限不足分别走 Licell 统一 error 包络和分类。

明确不做：

- 不修改 ECS provider 查询实现；provider contract 来自 `ecs-readonly-provider`。
- 不修改 auth/RAM/doctor capability；权限 contract 来自 `ecs-auth-read-permissions`。
- 不改变 `ecs list` parser、filters、文本输出或 JSON payload。
- 不做跨 region 自动搜索；实例查不到时提示用户确认 region 或显式传 `--region`。
- 不暴露 rawAttribute、userData、VNC URL、Cloud Assistant 输出、console output、password、key pair 私钥等敏感字段。
- 不注册 start/stop/reboot/delete/rm/runInstances 等 lifecycle 半成品命令。
- 不手改 README generated block 或 `docs/reference/agent-surfaces.md`；生成文档收口留给 `ecs-command-surface-docs`。

### 复杂度档位

走 CLI resource inspect 默认档位：`Robustness=L3`、`Structure=modules`、`Performance=reasonable`、`Readability=team`、`Testability=tested`、`Security=validated`。

偏离点：

- `Security=validated`：详情命令容易被误扩为 raw SDK attribute 展示，必须用白名单和敏感字段负向断言守住。
- `Robustness=L3`：not-found 是核心 agent-facing error contract，必须断言 JSON error category 为 `not_found`。

### 关键决策

1. **复用 `ecs` module，只新增 `ecs info` 子命令**  
   `ecs-list-command` 已负责创建 `INFRA_SECTION`、`ecs` namespace 和 registry 插入位置。本 feature 在同一 `src/commands/ecs.ts` 中追加 `ecs info <instanceId>`，避免第二个 module 重复拥有 `ecs` root 或重复声明 section。

2. **默认 region 不跨区搜索**  
   `DescribeInstances(instanceIds=[id])` 是 region scoped。默认跨所有 region 搜索会造成额外云调用、权限面和 agent 无界遍历风险；第一版只查当前 region，用户需要跨区时显式传 `--region`。

3. **命令层不补 raw attribute**  
   如果 provider 后续能用 `DescribeInstanceAttribute` 补 raw 详情，也不由 `ecs info` 直接外泄。命令 payload 只消费 provider 的 `EcsInstanceDetail` 白名单。

4. **not-found 分类依赖 provider token，但命令层必须验证分类**  
   provider 空结果应抛可被 `isNotFoundError()` 识别的错误；command test 仍要通过输出分类或 `emitCliError` 路径断言 category=`not_found`，防止命令层改写错误消息。

5. **descriptor/examples 只展示已注册可执行命令**  
   本 feature 可以让 `ecs` namespace 的 recommendedFlow 同时包含 `ecs list` 与 `ecs info <instanceId>`，但仍不得出现 lifecycle 命令。

### Top 3 风险与缓解

| 风险 | 缓解 |
|---|---|
| `ecs info` 把 provider detail 扩成 raw SDK attribute，泄漏敏感信息。 | Step 3/4 增加 JSON payload 白名单和敏感字段缺席断言；descriptor result fields 只列白名单。 |
| not-found 空结果被归为 `internal` 或 `input`，Agent 无法稳定处理。 | Step 2/3 覆盖 provider not-found 透传和 CLI JSON error category=`not_found`；错误消息不得包裹成不含 token 的新 Error。 |
| 与 `ecs-list-command` 重复创建 module/section 或 registry 顺序漂移。 | Step 1 只在既有 ECS module 追加 command；manifest test 断言无 duplicate root/section issue，section 顺序仍 data → infra → automation。 |

### 非显然依赖与关键假设

- 本 feature 依赖 `ecs-readonly-provider` 提供 `getEcsInstanceDetail(instanceId, { regionId })` 和 `EcsInstanceDetail` 白名单 contract。
- 本 feature 依赖 `ecs-auth-read-permissions` 提供 `AuthCapability='ecs'`。
- 本 feature 依赖 `ecs-list-command` 已创建 `INFRA_SECTION`、`ecs` namespace、registry wiring 和 section 顺序断言；实现时如果 list feature 尚未落地，应先合并/实现 list skeleton 再追加 info。
- 当前仓库可能没有 `node_modules`；实现前必须恢复依赖，`bun run typecheck` 是 core / fix-or-block。
- 假设 command tests 能 mock `../providers/ecs` 的 `getEcsInstanceDetail()` 并观察 command action 行为。
- `output.ts` 的 error category 判断会先匹配 input token，再匹配 not-found；not-found 测试必须使用形如 `i-xxx` 的干净 instanceId，避免用户输入中出现 `invalid` / `无效` 等 token 抢先把 not-found 归为 input。该分类顺序陷阱需要沉淀到 `.codestable/attention.md`。

### 必跑验证命令

- `bun run typecheck`
- `bun x vitest run src/__tests__/ecs-command.test.ts`
- `bun x vitest run src/__tests__/command-registry.test.ts src/__tests__/command-manifest.test.ts src/__tests__/command-surface-metadata.test.ts`
- `bun x vitest run src/__tests__/cli-help-json-contract.test.ts`
- `python3 .codestable/tools/validate-yaml.py --file .codestable/features/2026-07-03-ecs-info-command/ecs-info-command-checklist.yaml --yaml-only`

### 交付物与清洁度

交付物类别：

- `ecs info` command registration、descriptor、help/catalog metadata。
- `ecs-command` tests 扩展：info success、region、input、not-found、auth capability、sensitive field guard。
- 本 feature 的 review、QA、acceptance 报告。

清洁度规则：

- 不新增临时 `console.log`、TODO/FIXME、注释掉代码或未使用 import。
- 不新增 mutating ECS API 调用或 lifecycle command。
- 不手改 generated docs。
- 不写 `.licell/project.json`、`.licell/state.json` 或 workspace component 配置。

## 2. 名词与编排

### 2.1 名词层

#### 现状

- `ecs-list-command` design 已定义 `INFRA_SECTION`、`src/commands/ecs.ts`、`ecs list`、`ecs` namespace descriptor 和 registry 插入位置。
- `ecs-readonly-provider` design 已定义 `getEcsInstanceDetail(instanceId, options?: { regionId?: string }): Promise<EcsInstanceDetail>`，detail 形态为 `{ summary: EcsInstanceSummary }`。
- `src/commands/db.ts` 与 `src/commands/cache.ts` 的 `info <instanceId>` 模式是：`executeWithAuthRecovery()` → `ensureAuthOrExit()` → `toPromptValue(instanceId, 'instanceId')` → provider detail → `emitCommandResult()` 或文本输出。
- `src/utils/output.ts` 的 `detectErrorCategory()` 先匹配 input token，再通过 `isNotFoundError()` 把错误归为 `not_found`；provider not-found token 不能被命令层抹掉。

#### 变化

新增命令：

```ts
// 来源：src/commands/ecs.ts
const ecsInfoCommand = defineCliCommand({
  rawName: 'ecs info <instanceId>',
  description: '查看 ECS 实例基础详情',
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region，不跨 region 搜索' }
  ],
  descriptor: { ... }
});
```

Provider call：

```ts
await getEcsInstanceDetail(normalizedId, {
  regionId: toOptionalString(options.region)
});
```

JSON payload：

```json
{
  "regionId": "cn-hangzhou",
  "instanceId": "i-xxx",
  "detail": {
    "summary": {
      "instanceId": "i-xxx",
      "instanceName": "demo",
      "status": "Running",
      "regionId": "cn-hangzhou",
      "zoneId": "cn-hangzhou-h",
      "instanceType": "ecs.g7.large",
      "osName": "Alibaba Cloud Linux",
      "chargeType": "PostPaid",
      "vpcId": "vpc-xxx",
      "vSwitchId": "vsw-xxx",
      "privateIpAddresses": ["10.0.0.1"],
      "publicIpAddresses": [],
      "eipAddress": "47.0.0.1",
      "securityGroupIds": ["sg-xxx"],
      "tags": [{ "key": "env", "value": "prod" }],
      "createdAt": "2026-07-03T00:00:00Z",
      "expiredAt": null
    }
  }
}
```

Descriptor contract：

- `ecs info`：automation preferredOutput=json，safety level=safe，examples 至少包含 `licell ecs info <instanceId> --region cn-hangzhou --output json`。
- result fields 覆盖 `regionId`、`instanceId`、`detail.summary` 与白名单字段。
- optionInsights 说明 `--region` 用于跨默认 region 查询；未传不跨区搜索。
- namespace recommendedFlow 可以从 list → info：先 `licell ecs list --output json`，再 `licell ecs info <instanceId> --output json`。

##### Interface 设计检查

- Module：复用 `ECS CLI Command` module。
- Interface：用户/Agent 通过 `licell ecs info <instanceId> --output json` 获取单台实例基础详情；caller 必须知道默认只查当前 region，not-found 时应确认 region。
- Seam：命令测试 mock `getEcsInstanceDetail()` 观察 instanceId、region、payload 和错误分类。
- Depth / locality：命令层只处理 CLI parse、auth、文本/JSON 输出和 metadata；SDK/raw detail 留在 provider 内。
- Dependency strategy：provider 是 local-substitutable for tests；真实 ECS 外部依赖隐藏在 provider。
- Adapter：不新增 adapter。
- Test surface：`ecs-command.test.ts` 覆盖 success、region override、empty id/input、not-found、auth capability、sensitive field guard；help/catalog tests 覆盖 metadata。

### 2.2 编排层

#### 主流程图

```mermaid
flowchart TD
  A[user/agent: licell ecs info instanceId] --> B[executeWithAuthRecovery requiredCapabilities ecs]
  B --> C[ensureAuthOrExit]
  C --> D[normalize instanceId via toPromptValue]
  D --> E[normalize optional --region]
  E --> F[getEcsInstanceDetail(instanceId, region)]
  F --> G{found?}
  G -->|yes| H[emit JSON result or print compact detail]
  G -->|no| I[provider not-found error passes to CLI error envelope]
```

#### 现状

- `db info` / `cache info` 已提供 resource info command 的 thin-command 模式。
- 现有 RDS/Redis provider not-found 文案未必能命中 `isNotFoundError()`；ECS provider design 已专门修正 token，本 command feature 要防止命令层再破坏分类。
- command metadata 是 catalog/help/docs 的源头；generated docs 不在本 feature 手改。

#### 变化

`ecs info` 执行：

1. `executeWithAuthRecovery({ requiredCapabilities: ['ecs'] })`。
2. `ensureAuthOrExit()`。
3. `toPromptValue(instanceId, 'instanceId')` 校验非空；空值错误归 input。
4. `toOptionalString(options.region)` 传给 provider；不写全局 config。
5. `withSpinner(..., () => getEcsInstanceDetail(normalizedId, { regionId }))`。
6. JSON 模式 `emitCommandResult({ regionId: detail.summary.regionId, instanceId: detail.summary.instanceId, detail })`。
7. 文本模式打印 instanceId、name、status、region、zone、type、IP、security groups、tags；不打印 raw/sensitive 字段。

#### 流程级约束

- `instanceId` 不能为空；错误 message 使用 `toPromptValue` 现有 `不能为空` token。
- `--region` 只作为 provider option，不修改 auth region。
- not-found 错误不得被 catch 后改写为不含 `not exist` / `notfound` / `no such` 的 message。
- JSON payload 只返回 provider detail 白名单；如果 mock detail 中出现敏感字段，命令层不得主动添加或展示。
- 无副作用：不调用 `Config.setProject()`，不写本地状态。

### 2.3 挂载点清单

- `src/commands/ecs.ts`：在既有 ECS command module 中新增 `ecs info <instanceId>` command 和 descriptor。
- `src/commands/ecs.ts` 的 namespace descriptor：recommendedFlow / examples 可加入已注册的 `ecs info`。

不列入挂载点：

- `src/commands/sections.ts`、`src/commands/registry.ts`：由 `ecs-list-command` 创建和接入，本 feature 只要求顺序不漂移。
- provider/auth/docs/generated surface 不在本 feature 触碰。

### 2.4 推进策略

1. Command registration：在既有 ECS module 追加 `ecs info <instanceId>`，不新增第二个 module。  
   退出信号：manifest diagnostics 为空，`ecs` namespace 同时包含 `ecs list` 与 `ecs info`，section 顺序仍 data → infra → automation。
2. Execution path：接通 auth recovery、instanceId/region parse、provider detail、spinner。  
   退出信号：command test mock provider，断言 `requiredCapabilities=['ecs']`、`getEcsInstanceDetail('i-xxx', { regionId })`、空 instanceId 报 input。
3. JSON/text output + not-found：实现 result payload 和文本展示，锁定错误分类。  
   退出信号：JSON result 包含 `regionId/instanceId/detail.summary`；provider not-found 透传后 CLI error category=`not_found`；文本输出不含敏感字段。
4. Metadata：补 `ecs info` descriptor 与 namespace flow。  
   退出信号：help/catalog metadata 测试能看到 preferredOutput=json、safe safety、result fields、`--region` insight，examples/recommendedFlow 不含 lifecycle 命令。
5. Validation cleanup：运行验证并确认 scope 未漂移。  
   退出信号：typecheck、ecs-command test、manifest/help metadata tests、checklist yaml 校验通过，diff 不包含 provider/auth/docs generated 手改或 lifecycle command。

### 2.5 结构健康度与微重构

##### Compound 检索

`.codestable/compound/` 当前没有命中“目录 / 命名 / 归属 / composable / 组件”相关沉淀。

##### 评估

- 文件级 — `src/commands/ecs.ts`：由 `ecs-list-command` 新增，承载 ECS namespace/list/info 属于同一命令族，追加 info 符合一命令族一文件模式。
- 文件级 — `src/commands/registry.ts` / `src/commands/sections.ts`：本 feature 不应再修改；只通过测试确认 list feature 的注册顺序未漂移。
- 测试级 — `src/__tests__/ecs-command.test.ts`：list/info 共享 provider mock 与 command action helper，扩展同一文件符合现有 `db-command.test.ts` 风格。

##### 结论：不做微重构

`ecs info` 是薄命令，复用已建 ECS command module。没有安全的“只搬不改行为”前置重构。

##### 超出范围的观察

- 如果 `src/commands/ecs.ts` 在后续 lifecycle feature 中快速膨胀，可另起 refactor 拆分 parser/descriptor helpers；本 feature 不预先拆。

## 3. 验收契约

### 关键场景

- S1 registry：manifest diagnostics 为空，catalog/help 能看到 `ecs info <instanceId>`，没有 duplicate root/section issue。
- S2 success JSON：`ecs info i-xxx --region cn-hangzhou --output json` 调用 provider 并返回 `{ regionId, instanceId, detail }`。
- S3 default region：未传 `--region` 时 provider options 不带 `regionId`，由 provider 使用当前 auth region；命令不跨 region 搜索。
- S4 input：空 instanceId 报 input error，message 含 `不能为空`。
- S5 not-found：provider 抛 `ECS instance not exist: i-xxx` 时，CLI JSON error category 为 `not_found`；region 引导只作为错误文案或后续 docs 期望，不要求当前 `nextActions` 必然出现。
- S6 auth：命令通过 `executeWithAuthRecovery()` 使用 `requiredCapabilities: ['ecs']`。
- S7 whitelist：JSON/text 输出只包含 roadmap 白名单基础字段；不含 `rawAttribute/userData/vncUrl/consoleOutput/password/keyPairPrivateKey`。
- S8 help JSON：`ecs info --help --output json` 暴露 preferredOutput=json、safe safety、result fields、`--region` option insight。
- S9 no side effects：命令不写 `.licell/project.json` / `.licell/state.json`，不调用 mutating provider/API。
- S10 scope guard：不修改 provider/auth/generated docs，不注册 lifecycle 半成品命令。

### Acceptance Coverage Matrix

| 场景 | Checklist step | 证据类型 | 核心 |
|---|---|---|---|
| S1 registry/catalog | Step 1 / Step 4 | unit test / manifest diagnostics | yes |
| S2 / S3 success + region | Step 2 / Step 3 | command test / provider mock / JSON payload | yes |
| S4 input | Step 2 | command test / error classification | yes |
| S5 not-found | Step 3 | command test / JSON error category | yes |
| S6 auth capability | Step 2 | command test | yes |
| S7 whitelist | Step 3 | command test / diff review | yes |
| S8 help JSON metadata | Step 4 | help JSON integration test | yes |
| S9 / S10 no side effects + scope | Step 5 | diff review / validation output | yes |

### DoD Contract

| Gate | Contract |
|---|---|
| Design DoD | 本 design/checklist 通过独立 design-review；保持 draft，等待 epic 批量统一确认。 |
| Implementation DoD | `licell ecs info <instanceId>` 可执行，region/not-found/auth/json/help/whitelist 全部按验收场景通过测试。 |
| Review DoD | 独立 code review 重点检查 not-found 分类、敏感字段、region 语义、无副作用和未注册 lifecycle 命令。 |
| QA DoD | 跑 typecheck、ecs-command test、manifest/help metadata tests；如 help JSON 被触碰，跑 `cli-help-json-contract`。 |
| Acceptance DoD | 验收报告能从命令输出/测试/diff 证明 ECS info 已进入 catalog/help/json flow，且 generated docs 未手改。 |

Required artifacts：

- `ecs-info-command-review.md`
- `ecs-info-command-qa.md`
- `ecs-info-command-acceptance.md`
- 相关测试命令输出

## 4. 与项目级架构文档的关系

本 feature 改变 command registry 源头，但不直接同步生成文档。`ecs-command-surface-docs` 后续负责 `bun run docs:sync` / `docs:check`、README generated block 和 agent surface reference 收口。

如果实现期发现 provider detail 不再符合白名单或 not-found token 合同，必须回到 `ecs-readonly-provider` contract 修订，不能在 command 层临时包裹错误或补 raw 字段。
