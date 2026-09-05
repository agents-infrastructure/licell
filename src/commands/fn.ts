import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { Config } from '../utils/config';
import {
  getFunctionInfo,
  invokeFunction,
  listFunctionAliases,
  listFunctionCapacity,
  listFunctionInstances,
  listFunctionLayers,
  listFunctionSessions,
  listFunctionTags,
  listFunctionTriggers,
  listFunctionVpcBindings,
  listFunctions,
  removeFunction
} from '../providers/fc';
import { tailLogs } from '../providers/logs';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  createSpinner,
  showIntro,
  showOutro,
  withSpinner
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { resolveOptionalPayloadInput } from '../utils/payload-input';
import { fnDomainCommandBundle } from './fn-domain';
import { DELIVERY_SECTION } from './sections';

const fnListCommand = defineCliCommand({
  rawName: 'fn list',
  description: '查看函数列表',
  region: { scope: 'auth' },
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 20' },
    { rawName: '--prefix <prefix>', description: '按函数名前缀过滤' }
  ]
});

const fnAliasesCommand = defineCliCommand({
  rawName: 'fn aliases <name>',
  description: '查看函数别名和版本路由（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' },
    { rawName: '--prefix <prefix>', description: '按别名前缀过滤' }
  ],
  descriptor: {
    title: 'List FC aliases',
    summary: '通过 FC ListAliases 只读 API 列出函数别名、目标版本和灰度权重。',
    examples: [
      'licell fn aliases my-function --output json',
      'licell fn aliases my-function --prefix prod --output json'
    ],
    argumentHints: { name: '函数名称；先用 `licell fn list` 获取。' },
    related: ['fn list', 'fn info', 'fn invoke', 'api invoke', 'capability search'],
    agentTips: [
      '读取 `aliases[].versionId` 确认 alias 指向的已发布版本，再将 alias 传给 `fn info/invoke --target`。',
      '本命令只读取 alias 元数据，不创建、更新或删除 alias。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--limit', '--prefix'] },
    safety: { level: 'safe', reason: '只调用 FC ListAliases 读取函数 alias 摘要。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出函数', command: 'licell fn list --output json', reason: '获取准确函数名称。' },
      { title: '列出函数别名', command: 'licell fn aliases <name> --output json', reason: '查看 alias 到版本的路由关系。' },
      { title: '查看目标版本详情', command: 'licell fn info <name> --target <alias> --output json', reason: '读取 alias 当前指向版本的函数配置。' }
    ],
    result: {
      summary: '返回函数 alias 摘要、过滤条件和数量。',
      outcomeKey: 'aliases',
      fields: [
        { name: 'stage', description: '固定为 `fn.aliases`。', required: true },
        { name: 'functionName', description: '实际查询的函数名称。', required: true },
        { name: 'count', description: '返回 alias 数量。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的别名前缀过滤条件。', required: true },
        { name: 'aliases[]', description: 'alias 名称、目标版本、描述、时间和灰度权重。', required: true }
      ]
    }
  }
});

const fnTriggersCommand = defineCliCommand({
  rawName: 'fn triggers <name>',
  description: '查看函数触发器（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' },
    { rawName: '--prefix <prefix>', description: '按触发器名称前缀过滤' }
  ],
  descriptor: {
    title: 'List FC triggers',
    summary: '通过 FC ListTriggers 只读 API 列出函数触发器配置摘要。',
    examples: [
      'licell fn triggers my-function --output json',
      'licell fn triggers my-function --prefix http --output json'
    ],
    argumentHints: { name: '函数名称；先用 `licell fn list` 获取。' },
    related: ['fn list', 'fn aliases', 'fn info', 'api invoke', 'capability search'],
    agentTips: [
      '读取 `triggers[].triggerType`、`status` 和 `qualifier` 判断函数的事件入口。',
      '不会返回原始 `triggerConfig`，避免把 webhook、角色或连接信息直接暴露给 Agent。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--limit', '--prefix'] },
    safety: { level: 'safe', reason: '只调用 FC ListTriggers 读取触发器摘要。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出函数', command: 'licell fn list --output json', reason: '获取准确函数名称。' },
      { title: '列出触发器', command: 'licell fn triggers <name> --output json', reason: '查看事件入口、状态和绑定版本。' },
      { title: '查看函数详情', command: 'licell fn info <name> --output json', reason: '读取函数运行时和配置摘要。' }
    ],
    result: {
      summary: '返回函数触发器类型、名称、状态、绑定版本和时间摘要。',
      outcomeKey: 'triggers',
      fields: [
        { name: 'stage', description: '固定为 `fn.triggers`。', required: true },
        { name: 'functionName', description: '实际查询的函数名称。', required: true },
        { name: 'count', description: '返回触发器数量。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的触发器前缀过滤条件。', required: true },
        { name: 'triggers[]', description: '触发器名称、类型、状态、绑定版本、来源和时间摘要。', required: true }
      ]
    }
  }
});

const fnLayersCommand = defineCliCommand({
  rawName: 'fn layers',
  description: '查看 FC 层列表（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' },
    { rawName: '--prefix <prefix>', description: '按层名称前缀过滤' }
  ],
  descriptor: {
    title: 'List FC layers',
    summary: '通过 FC ListLayers 只读 API 列出层版本和运行时兼容性摘要。',
    examples: [
      'licell fn layers --output json',
      'licell fn layers --prefix common --output json'
    ],
    argumentHints: {},
    related: ['fn list', 'fn info', 'api invoke', 'capability search'],
    agentTips: [
      '读取 `layers[].compatibleRuntime` 判断层是否可以挂载到目标函数运行时。',
      '本命令只读取层元数据，不下载层代码或修改层 ACL。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['--limit', '--prefix'] },
    safety: { level: 'safe', reason: '只调用 FC ListLayers 读取层元数据。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出层', command: 'licell fn layers --output json', reason: '获取可复用的层名称、版本和运行时。' },
      { title: '查看函数', command: 'licell fn list --output json', reason: '确认目标函数和运行时。' },
      { title: '查看层详情', command: 'licell api invoke fc.GetLayerVersion --param layerName=<name> --param version=<version> --output json', reason: '需要完整层详情时使用 raw fallback。' }
    ],
    result: {
      summary: '返回层名称、版本、ACL、兼容运行时、大小、ARN 和时间摘要。',
      outcomeKey: 'layers',
      fields: [
        { name: 'stage', description: '固定为 `fn.layers`。', required: true },
        { name: 'count', description: '返回层版本数量。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的层名称前缀过滤条件。', required: true },
        { name: 'layers[]', description: '层名称、版本、ACL、兼容运行时、大小、ARN 和时间摘要。', required: true }
      ]
    }
  }
});

const fnCapacityCommand = defineCliCommand({
  rawName: 'fn capacity [name]',
  description: '查看函数并发、预留实例和伸缩配置（只读）',
  region: { scope: 'auth' },
  options: [{ rawName: '--limit <n>', description: '每类配置返回数量，默认 50，最大 200' }],
  descriptor: {
    title: 'Inspect FC capacity',
    summary: '汇总 FC 并发配额、预留实例和弹性伸缩配置；可盘点地域或指定函数。',
    examples: [
      'licell fn capacity --output json',
      'licell fn capacity my-function --output json'
    ],
    argumentHints: { name: '可选函数名称；为空时盘点当前地域全部函数的容量配置。' },
    related: ['fn list', 'fn aliases', 'fn info', 'api invoke', 'capability search'],
    agentTips: [
      '结合 `concurrency[].reservedConcurrency`、`provision[].current/target` 和 `scaling[].currentInstances/targetInstances` 判断容量状态。',
      '本命令只读取配置；调整容量前应先记录当前值并通过 raw API dry-run 或后续领域写命令生成计划。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--limit'] },
    safety: { level: 'safe', reason: '只调用 FC ListConcurrencyConfigs、ListProvisionConfigs 和 ListScalingConfigs。', confirmFlags: [] },
    recommendedFlow: [
      { title: '查看容量配置', command: 'licell fn capacity [name] --output json', reason: '统一盘点并发、预留实例和伸缩状态。' },
      { title: '查看函数详情', command: 'licell fn info <name> --output json', reason: '核对运行时、内存和单实例并发。' },
      { title: '查看原始 API 定义', command: 'licell capability search --product fc --intent "capacity config" --action inspect --output json', reason: '需要更细粒度字段时进入 protocol capability。' }
    ],
    result: {
      summary: '返回并发配额、预留实例和弹性伸缩三类安全摘要。',
      outcomeKey: 'capacity',
      fields: [
        { name: 'stage', description: '固定为 `fn.capacity`。', required: true },
        { name: 'functionName', description: '函数过滤条件；地域盘点时为 null。', required: true },
        { name: 'counts', description: '三类配置各自的返回数量。', required: true },
        { name: 'truncated', description: '三类配置是否达到 limit，达到时应缩小函数范围。', required: true },
        { name: 'capacity.concurrency[]', description: '函数 ARN 和保留并发配额。', required: true },
        { name: 'capacity.provision[]', description: '预留实例当前值、目标值、默认目标及策略数量。', required: true },
        { name: 'capacity.scaling[]', description: '弹性伸缩当前/目标/最小实例数、模式及策略数量。', required: true }
      ]
    }
  }
});

const fnInstancesCommand = defineCliCommand({
  rawName: 'fn instances <name>',
  description: '查看函数执行实例（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--qualifier <alias-or-version>', description: '限定 alias 或版本，默认 LATEST' },
    { rawName: '--status <status>', description: '按实例状态过滤' },
    { rawName: '--all-active', description: '包含全部活跃实例' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List FC instances',
    summary: '通过 FC ListInstances 只读 API 查看指定函数的执行实例及生命周期状态。',
    examples: [
      'licell fn instances my-function --output json',
      'licell fn instances my-function --qualifier prod --all-active --output json'
    ],
    argumentHints: { name: '函数名称；先用 `licell fn list` 获取。' },
    related: ['fn list', 'fn capacity', 'fn sessions', 'fn info', 'capability search'],
    agentTips: [
      '结合 `instances[].status/resourceType/versionId` 判断函数当前实例分布。',
      '实例是运行时瞬时资源；空结果不等于函数不存在，可继续查看 `fn info` 和 `fn capacity`。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--qualifier', '--status', '--all-active', '--limit'] },
    safety: { level: 'safe', reason: '只调用 FC ListInstances 读取运行实例摘要。', confirmFlags: [] },
    recommendedFlow: [
      { title: '查看函数', command: 'licell fn info <name> --output json', reason: '确认函数和目标版本存在。' },
      { title: '查看实例', command: 'licell fn instances <name> --all-active --output json', reason: '盘点当前活跃执行实例。' },
      { title: '查看容量', command: 'licell fn capacity <name> --output json', reason: '核对实例数量与预留/伸缩配置。' }
    ],
    result: {
      summary: '返回指定函数的执行实例状态和生命周期摘要。',
      outcomeKey: 'instances',
      fields: [
        { name: 'stage', description: '固定为 `fn.instances`。', required: true },
        { name: 'functionName', description: '实际查询的函数名。', required: true },
        { name: 'filters', description: 'qualifier、状态和 all-active 过滤条件。', required: true },
        { name: 'count', description: '返回实例数量。', required: true },
        { name: 'truncated', description: '结果是否达到 limit。', required: true },
        { name: 'instances[]', description: '实例 ID、状态、版本、资源类型和生命周期时间。', required: true }
      ]
    }
  }
});

const fnSessionsCommand = defineCliCommand({
  rawName: 'fn sessions <name>',
  description: '查看函数显式会话（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--qualifier <alias-or-version>', description: '限定 alias 或版本' },
    { rawName: '--status <status>', description: '按会话状态过滤，例如 Active 或 Expired' },
    { rawName: '--session <session-id>', description: '按 session ID 精确过滤' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List FC sessions',
    summary: '通过 FC ListSessions 只读 API 查看指定函数的显式会话状态和生命周期。',
    examples: [
      'licell fn sessions my-function --output json',
      'licell fn sessions my-function --qualifier prod --status Active --output json'
    ],
    argumentHints: { name: '函数名称；先用 `licell fn list` 获取。' },
    related: ['fn list', 'fn instances', 'fn capacity', 'fn info', 'capability search'],
    agentTips: [
      '读取 `sessions[].sessionStatus`、TTL 和 idle timeout 判断会话是否仍可路由。',
      '结果不会包含 NAS、OSS 或 PolarFS 挂载配置；需要原始详情时先审查 `fc.GetSession` 的响应安全边界。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--qualifier', '--status', '--session', '--limit'] },
    safety: { level: 'safe', reason: '只调用 FC ListSessions 读取显式会话摘要。', confirmFlags: [] },
    recommendedFlow: [
      { title: '查看函数', command: 'licell fn info <name> --output json', reason: '确认函数和目标版本存在。' },
      { title: '查看活跃会话', command: 'licell fn sessions <name> --status Active --output json', reason: '盘点仍可路由的显式会话。' },
      { title: '查看绑定实例', command: 'licell fn instances <name> --all-active --output json', reason: '核对会话对应的运行实例。' }
    ],
    result: {
      summary: '返回指定函数的显式会话状态、亲和类型和生命周期摘要。',
      outcomeKey: 'sessions',
      fields: [
        { name: 'stage', description: '固定为 `fn.sessions`。', required: true },
        { name: 'functionName', description: '实际查询的函数名。', required: true },
        { name: 'filters', description: 'qualifier、状态和 session ID 过滤条件。', required: true },
        { name: 'count', description: '返回会话数量。', required: true },
        { name: 'truncated', description: '结果是否达到 limit。', required: true },
        { name: 'sessions[]', description: '会话 ID、状态、亲和类型、TTL、容器 ID 和时间。', required: true }
      ]
    }
  }
});

const fnVpcBindingsCommand = defineCliCommand({
  rawName: 'fn vpc-bindings <name>',
  description: '查看函数绑定的 VPC（只读）',
  region: { scope: 'auth' },
  descriptor: {
    title: 'List FC VPC bindings',
    summary: '通过 FC ListVpcBindings 只读 API 查看指定函数可访问的 VPC ID。',
    examples: ['licell fn vpc-bindings my-function --output json'],
    argumentHints: { name: '函数名称；先用 `licell fn list` 获取。' },
    related: ['fn list', 'fn info', 'vpc info', 'vpc topology', 'capability search'],
    agentTips: [
      '结果只表示 FC 函数与 VPC 的访问绑定；用 `vpc info/topology` 继续查看交换机、路由和 NAT。',
      '本命令不创建或删除绑定。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name'] },
    safety: { level: 'safe', reason: '只调用 FC ListVpcBindings 读取 VPC ID。', confirmFlags: [] },
    recommendedFlow: [
      { title: '查看函数', command: 'licell fn info <name> --output json', reason: '确认目标函数。' },
      { title: '查看 VPC 绑定', command: 'licell fn vpc-bindings <name> --output json', reason: '获取函数可访问的 VPC ID。' },
      { title: '查看网络拓扑', command: 'licell vpc topology <vpc-id> --output json', reason: '继续盘点该 VPC 的网络资源。' }
    ],
    result: {
      summary: '返回指定函数绑定的 VPC ID。',
      outcomeKey: 'vpcIds',
      fields: [
        { name: 'stage', description: '固定为 `fn.vpc-bindings`。', required: true },
        { name: 'functionName', description: '实际查询的函数名。', required: true },
        { name: 'count', description: '绑定的 VPC 数量。', required: true },
        { name: 'vpcIds[]', description: '去重后的 VPC ID 数组。', required: true }
      ]
    }
  }
});

const fnTagsCommand = defineCliCommand({
  rawName: 'fn tags [name]',
  description: '查看函数资源标签（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--tag <key=value>', description: '按标签过滤；可重复传入，最多 20 个' },
    { rawName: '--limit <n>', description: '返回标签记录数，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List FC function tags',
    summary: '通过 FC ListTagResources 只读 API 按函数名或标签条件列出当前地域的函数资源标签。',
    examples: [
      'licell fn tags my-function --output json',
      'licell fn tags --tag env=prod --output json',
      'licell fn tags my-function --tag env=prod --output json'
    ],
    argumentHints: { name: '可选函数名称；不传时必须至少传入一个 `--tag key=value`。' },
    related: ['fn list', 'fn info', 'fn vpc-bindings', 'capability search'],
    agentTips: [
      '每条 `tagResources[]` 表示一个函数资源上的一个标签键值；同一 resourceId 可出现多次。',
      '指定函数名时会构建完整 FC 资源 ID 做服务端精确查询；不指定函数时必须传 `--tag`。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['name', '--tag', '--limit'] },
    safety: { level: 'safe', reason: '只调用 FC ListTagResources 读取函数标签。', confirmFlags: [] },
    recommendedFlow: [
      { title: '查看标签', command: 'licell fn tags <name> --output json', reason: '盘点指定函数的资源标签。' },
      { title: '按标签筛选', command: 'licell fn tags --tag env=prod --output json', reason: '用服务端标签条件缩小范围。' },
      { title: '查看函数详情', command: 'licell fn info <name> --output json', reason: '核对标签对应的函数。' }
    ],
    result: {
      summary: '返回函数资源 ID 及标签键值记录。',
      outcomeKey: 'tagResources',
      fields: [
        { name: 'stage', description: '固定为 `fn.tags`。', required: true },
        { name: 'functionName', description: '函数名过滤；地域盘点时为 null。', required: true },
        { name: 'count', description: '返回的标签记录数。', required: true },
        { name: 'scannedCount', description: '为完成函数名过滤扫描的原始标签记录数。', required: true },
        { name: 'truncated', description: '是否仍有未扫描的分页。', required: true },
        { name: 'filters', description: '函数名和标签过滤条件。', required: true },
        { name: 'tagResources[]', description: '函数名、资源 ID、资源类型及标签键值。', required: true }
      ]
    }
  }
});

const fnInfoCommand = defineCliCommand({
  rawName: 'fn info [name]',
  description: '查看函数详情',
  region: { scope: 'project' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' }
  ]
});

const fnInvokeCommand = defineCliCommand({
  rawName: 'fn invoke [name]',
  description: '调用函数（同步）',
  region: { scope: 'project' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--payload <text>', description: '传入原始 payload 文本' },
    { rawName: '--file <path>', description: '从文件读取 payload' }
  ]
});

const fnRmCommand = defineCliCommand({
  rawName: 'fn rm [name]',
  description: '删除函数',
  region: { scope: 'project' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--force', description: '级联删除触发器、alias、已发布版本后再删除函数' },
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ]
});

const fnLogsCommand = defineCliCommand({
  rawName: 'fn logs [name]',
  description: '查看函数日志（默认实时流式）',
  region: { scope: 'project' },
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--once', description: '仅拉取一次最近日志并退出' },
    { rawName: '--window <seconds>', description: '一次拉取模式的时间窗（默认 120 秒）' },
    { rawName: '--lines <n>', description: '每次请求最大日志条数（默认 1000）' }
  ],
  descriptor: {
    title: 'View FC function logs',
    notes: [
      '默认读取当前函数在 FC 默认 SLS project / logstore 中的日志；会自动探测 FC 2.0 / 3.0 的默认日志项目。',
      '需要跨 project/logstore 或自定义 SLS 语法时，改用 `licell logs query` 或 `licell logs tail`。',
      '当使用 `--output json` 时，会自动退化为一次性拉取模式，避免持续流式输出。'
    ],
    examples: [
      'licell fn logs',
      'licell fn logs my-function',
      'licell fn logs my-function --once --window 300 --output json',
      'licell logs query -p your-project -s your-store \'*\' --output json'
    ],
    optionInsights: {
      '--once': { whenToUse: '需要抓取最近一批日志并立即退出时使用。' },
      '--window': { whenToUse: '一次性抓取时需要扩大或缩小时间范围时使用。' },
      '--lines': { whenToUse: '希望限制单次请求返回的最大日志条数时使用。' }
    },
    recommendedFlow: [
      { title: '先单次拉取', command: 'licell fn logs [name] --once --output json', reason: '先确认当前函数是否有日志以及日志格式。' },
      { title: '必要时扩大时间窗', command: 'licell fn logs [name] --once --window 300 --output json', reason: '排查较早前的报错或冷启动日志。' },
      { title: '进入实时流', command: 'licell fn logs [name]', reason: '确认问题仍在发生时，持续观察新日志。' },
      { title: '切换到通用 SLS 查询', command: 'licell logs query -p <project> -s <store> --output json', reason: '需要跨 logstore 或使用更复杂的查询条件时使用。' }
    ],
    result: {
      summary: '返回某个函数的一次性日志抓取结果。',
      outcomeKey: 'lines',
      fields: [
        { name: 'stage', description: '固定为 `fn.logs`。', required: true },
        { name: 'functionName', description: '实际查询的函数名。', required: true },
        { name: 'once', description: '是否为一次性抓取模式。', required: true },
        { name: 'lines', description: '日志行数组；流式模式下不返回。', required: true },
        { name: 'count', description: '返回日志条数。', required: true }
      ]
    },
    agentTips: [
      'Agent 优先使用 `licell fn logs [name] --once --output json`。',
      '如果要查询任意 SLS logstore，改用 `licell logs query --output json`。'
    ],
    related: ['logs query', 'logs tail', 'fn info', 'task info']
  }
});

function parseFunctionTagFilters(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const tags = values.map((item) => {
    const raw = toOptionalString(item);
    const separator = raw?.indexOf('=') ?? -1;
    if (!raw || separator < 1) throw new Error('tag 过滤条件无效：请使用 key=value 格式');
    const key = raw.slice(0, separator).trim();
    const value = raw.slice(separator + 1).trim();
    if (!key) throw new Error('tag key 不能为空');
    return { key, ...(value ? { value } : {}) };
  });
  if (tags.length > 20) throw new Error('tag 过滤条件最多允许 20 个');
  return tags;
}

function functionNameFromTagResourceId(resourceId: string | undefined) {
  const encodedName = resourceId?.match(/(?:^|[:/])functions\/([^/]+)$/)?.[1];
  if (!encodedName) return null;
  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

export function registerFnCommands(cli: CAC) {
  fnDomainCommandBundle.register(cli);

  registerCliCommand(cli, fnTagsCommand)
    .action(async (name: string | undefined, options: { tag?: unknown; limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnTagsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const tags = parseFunctionTagFilters(options.tag);
          const response = await listFunctionTags({ functionName: name, tags, limit });
          const result = {
            stage: 'fn.tags',
            functionName: response.functionName || null,
            resourceType: response.resourceType,
            count: response.tagResources.length,
            scannedCount: response.scannedCount,
            limit,
            truncated: response.truncated,
            filters: { ...(name ? { functionName: name } : {}), ...(tags.length > 0 ? { tags } : {}) },
            tagResources: response.tagResources.map((item) => ({
              functionName: functionNameFromTagResourceId(item.resourceId),
              resourceId: item.resourceId || null,
              resourceType: item.resourceType || response.resourceType,
              tagKey: item.tagKey || null,
              tagValue: item.tagValue ?? null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC function tags (${result.count})`));
            for (const item of result.tagResources) console.log(`- ${pc.cyan(item.functionName || item.resourceId || '-')}  ${item.tagKey || '-'}=${item.tagValue ?? ''}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnVpcBindingsCommand)
    .action(async (name: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnVpcBindingsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const response = await listFunctionVpcBindings(name);
          const result = {
            stage: 'fn.vpc-bindings',
            functionName: response.functionName,
            count: response.vpcIds.length,
            vpcIds: response.vpcIds
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC VPC bindings (${result.count})`));
            for (const vpcId of result.vpcIds) console.log(`- ${pc.cyan(vpcId)}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnSessionsCommand)
    .action(async (name: string, options: { qualifier?: unknown; status?: unknown; session?: unknown; limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnSessionsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const qualifier = toOptionalString(options.qualifier);
          const status = toOptionalString(options.status);
          const sessionId = toOptionalString(options.session);
          const response = await listFunctionSessions({ functionName: name, qualifier, status, sessionId, limit });
          const result = {
            stage: 'fn.sessions', functionName: response.functionName, limit,
            count: response.sessions.length,
            truncated: response.sessions.length >= limit,
            filters: { ...(qualifier ? { qualifier } : {}), ...(status ? { status } : {}), ...(sessionId ? { sessionId } : {}) },
            sessions: response.sessions.map((item) => ({
              sessionId: item.sessionId || null,
              sessionStatus: item.sessionStatus || null,
              functionName: item.functionName || response.functionName,
              qualifier: item.qualifier || null,
              sessionAffinityType: item.sessionAffinityType || null,
              sessionTTLInSeconds: item.sessionTTLInSeconds ?? null,
              sessionIdleTimeoutInSeconds: item.sessionIdleTimeoutInSeconds ?? null,
              disableSessionIdReuse: item.disableSessionIdReuse ?? null,
              containerId: item.containerId || null,
              createdTime: item.createdTime || null,
              lastModifiedTime: item.lastModifiedTime || null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC sessions (${result.count})`));
            for (const item of result.sessions) console.log(`- ${pc.cyan(item.sessionId || '-')}  status=${item.sessionStatus || '-'}  qualifier=${item.qualifier || '-'}  ttl=${item.sessionTTLInSeconds ?? '-'}s`);
          }
        }
      );
    });

  registerCliCommand(cli, fnInstancesCommand)
    .action(async (name: string, options: { qualifier?: unknown; status?: unknown; allActive?: unknown; limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnInstancesCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const qualifier = toOptionalString(options.qualifier);
          const status = toOptionalString(options.status);
          const withAllActive = options.allActive === true;
          const response = await listFunctionInstances({ functionName: name, qualifier, status, withAllActive, limit });
          const result = {
            stage: 'fn.instances', functionName: response.functionName, requestId: response.requestId || null, limit,
            count: response.instances.length,
            truncated: response.instances.length >= limit,
            filters: { ...(qualifier ? { qualifier } : {}), ...(status ? { status } : {}), ...(withAllActive ? { withAllActive: true } : {}) },
            instances: response.instances.map((item) => ({
              instanceId: item.instanceId || null,
              status: item.status || null,
              qualifier: item.qualifier || null,
              versionId: item.versionId || null,
              resourceType: item.resourceType || null,
              createdTimeMs: item.createdTimeMs ?? null,
              destroyedTimeMs: item.destroyedTimeMs ?? null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC instances (${result.count})`));
            for (const item of result.instances) console.log(`- ${pc.cyan(item.instanceId || '-')}  status=${item.status || '-'}  qualifier=${item.qualifier || '-'}  version=${item.versionId || '-'}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnCapacityCommand)
    .action(async (name: string | undefined, options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnCapacityCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const capacity = await listFunctionCapacity({ functionName: name, limit });
          const result = {
            stage: 'fn.capacity',
            functionName: capacity.functionName || null,
            limit,
            counts: {
              concurrency: capacity.concurrency.length,
              provision: capacity.provision.length,
              scaling: capacity.scaling.length
            },
            truncated: {
              concurrency: capacity.concurrency.length >= limit,
              provision: capacity.provision.length >= limit,
              scaling: capacity.scaling.length >= limit
            },
            capacity: {
              concurrency: capacity.concurrency.map((item) => ({
                functionArn: item.functionArn || null,
                reservedConcurrency: item.reservedConcurrency ?? null
              })),
              provision: capacity.provision.map((item) => ({
                functionArn: item.functionArn || null,
                current: item.current ?? null,
                target: item.target ?? null,
                defaultTarget: item.defaultTarget ?? null,
                alwaysAllocateCPU: item.alwaysAllocateCPU ?? null,
                alwaysAllocateGPU: item.alwaysAllocateGPU ?? null,
                currentError: item.currentError || null,
                scheduledActionCount: item.scheduledActions?.length || 0,
                targetTrackingPolicyCount: item.targetTrackingPolicies?.length || 0
              })),
              scaling: capacity.scaling.map((item) => ({
                functionArn: item.functionArn || null,
                currentInstances: item.currentInstances ?? null,
                targetInstances: item.targetInstances ?? null,
                minInstances: item.minInstances ?? null,
                enableMixMode: item.enableMixMode ?? null,
                enableOnDemandScaling: item.enableOnDemandScaling ?? null,
                requestDispatchPolicy: item.requestDispatchPolicy || null,
                residentPoolId: item.residentPoolId || null,
                currentError: item.currentError || null,
                horizontalPolicyCount: item.horizontalScalingPolicies?.length || 0,
                scheduledPolicyCount: item.scheduledPolicies?.length || 0
              }))
            }
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC capacity (${name || 'current region'})`));
            console.log(`- concurrency configs: ${result.counts.concurrency}`);
            console.log(`- provision configs:   ${result.counts.provision}`);
            console.log(`- scaling configs:     ${result.counts.scaling}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnLayersCommand)
    .action(async (options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnLayersCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const prefix = toOptionalString(options.prefix)?.toLowerCase();
          const layers = await listFunctionLayers(limit, prefix);
          const result = {
            stage: 'fn.layers',
            count: layers.length,
            limit,
            truncated: layers.length >= limit,
            filters: prefix ? { prefix } : {},
            layers: layers.map((layer) => ({
              layerName: layer.layerName || '',
              version: layer.version ?? null,
              acl: layer.acl || null,
              compatibleRuntime: layer.compatibleRuntime || [],
              codeSize: layer.codeSize ?? null,
              layerVersionArn: layer.layerVersionArn || null,
              description: layer.description || null,
              license: layer.license || null,
              createTime: layer.createTime || null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC layers (${result.count})`));
            for (const layer of result.layers) console.log(`- ${pc.cyan(layer.layerName)}@${layer.version ?? '-'}  runtimes=${layer.compatibleRuntime.join(',') || '-'}  size=${layer.codeSize ?? '-'}B`);
          }
        }
      );
    });

  registerCliCommand(cli, fnTriggersCommand)
    .action(async (name: string, options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnTriggersCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const prefix = toOptionalString(options.prefix)?.toLowerCase();
          const triggers = await listFunctionTriggers(name, limit, prefix);
          const result = {
            stage: 'fn.triggers',
            functionName: name,
            count: triggers.length,
            limit,
            truncated: triggers.length >= limit,
            filters: prefix ? { prefix } : {},
            triggers: triggers.map((trigger) => ({
              triggerName: trigger.triggerName || '',
              triggerType: trigger.triggerType || null,
              status: trigger.status || null,
              qualifier: trigger.qualifier || null,
              triggerId: trigger.triggerId || null,
              sourceArn: trigger.sourceArn || null,
              targetArn: trigger.targetArn || null,
              description: trigger.description || null,
              createdTime: trigger.createdTime || null,
              lastModifiedTime: trigger.lastModifiedTime || null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC triggers (${result.count})`));
            for (const trigger of result.triggers) console.log(`- ${pc.cyan(trigger.triggerName)}  type=${trigger.triggerType || '-'}  status=${trigger.status || '-'}  qualifier=${trigger.qualifier || '-'}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnAliasesCommand)
    .action(async (name: string, options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnAliasesCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 50, 200);
          const prefix = toOptionalString(options.prefix)?.toLowerCase();
          const aliases = await listFunctionAliases(name, limit);
          const filtered = prefix
            ? aliases.filter((alias) => (alias.aliasName || '').toLowerCase().startsWith(prefix))
            : aliases;
          const result = {
            stage: 'fn.aliases',
            functionName: name,
            count: filtered.length,
            limit,
            truncated: aliases.length >= limit,
            filters: prefix ? { prefix } : {},
            aliases: filtered.map((alias) => ({
              aliasName: alias.aliasName || '',
              versionId: alias.versionId || null,
              description: alias.description || null,
              createdTime: alias.createdTime || null,
              lastModifiedTime: alias.lastModifiedTime || null,
              additionalVersionWeight: alias.additionalVersionWeight || null
            }))
          };
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`FC aliases (${result.count})`));
            for (const alias of result.aliases) console.log(`- ${pc.cyan(alias.aliasName)}  version=${alias.versionId || '-'}  weight=${alias.additionalVersionWeight ? JSON.stringify(alias.additionalVersionWeight) : '-'}`);
          }
        }
      );
    });

  registerCliCommand(cli, fnListCommand)
    .action(async (options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const prefix = toOptionalString(options.prefix);

          const s = createSpinner();
          const functions = await withSpinner(
            s,
            '正在拉取函数列表...',
            '❌ 获取函数列表失败',
            () => listFunctions(limit, prefix)
          );
          if (!functions) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${functions.length} 个函数`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              count: functions.length,
              functions
            });
            return;
          }
          if (functions.length === 0) {
            showOutro('当前地域没有函数');
            return;
          }
          for (const fn of functions) {
            console.log(
              `${pc.cyan(fn.functionName)}  runtime=${pc.gray(fn.runtime || '-')}  state=${pc.gray(fn.state || '-')}  updated=${pc.gray(fn.lastModifiedTime || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnInfoCommand)
    .action(async (name: string | undefined, options: { component?: unknown; target?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          const qualifier = toOptionalString(options.target);

          const s = createSpinner();
          const fn = await withSpinner(
            s,
            `正在拉取函数 ${functionName} 详情...`,
            '❌ 获取函数详情失败',
            () => getFunctionInfo(functionName, qualifier || undefined)
          );
          if (!fn) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCommandResult({
              component: component || null,
              functionName: fn.functionName || functionName,
              qualifier: qualifier || null,
              runtime: fn.runtime || null,
              handler: fn.handler || null,
              state: fn.state || null,
              memorySize: fn.memorySize ?? null,
              cpu: (fn as { cpu?: unknown }).cpu ?? null,
              instanceConcurrency: (fn as { instanceConcurrency?: unknown }).instanceConcurrency ?? null,
              timeout: fn.timeout ?? null,
              vpcConfig: (fn as { vpcConfig?: unknown }).vpcConfig ?? null,
              updatedAt: fn.lastModifiedTime || null,
              envCount: Object.keys(fn.environmentVariables || {}).length
            });
            return;
          }
          console.log(`\nfunction: ${pc.cyan(fn.functionName || functionName)}`);
          if (qualifier) console.log(`qualifier: ${pc.cyan(qualifier)}`);
          console.log(`runtime:   ${pc.cyan(fn.runtime || '-')}`);
          console.log(`handler:   ${pc.cyan(fn.handler || '-')}`);
          console.log(`state:     ${pc.cyan(fn.state || '-')}`);
          console.log(`memory:    ${pc.cyan(String(fn.memorySize || '-'))}`);
          console.log(`vcpu:      ${pc.cyan(String((fn as { cpu?: unknown }).cpu ?? '-'))}`);
          console.log(`concur:    ${pc.cyan(String((fn as { instanceConcurrency?: unknown }).instanceConcurrency ?? '-'))}`);
          console.log(`timeout:   ${pc.cyan(String(fn.timeout || '-'))}`);
          const vpcConfig = (fn as { vpcConfig?: { vpcId?: string; vSwitchIds?: string[]; securityGroupId?: string } }).vpcConfig;
          if (vpcConfig?.vpcId) {
            console.log(`vpc:       ${pc.cyan(`${vpcConfig.vpcId} / ${(vpcConfig.vSwitchIds || []).join(',') || '-'} / ${vpcConfig.securityGroupId || '-'}`)}`);
          } else {
            console.log(`vpc:       ${pc.cyan('-')}`);
          }
          console.log(`updated:   ${pc.cyan(fn.lastModifiedTime || '-')}`);
          console.log(`envCount:  ${pc.cyan(String(Object.keys(fn.environmentVariables || {}).length))}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnInvokeCommand)
    .action(async (name: string | undefined, options: { component?: unknown; target?: unknown; payload?: unknown; file?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnInvokeCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          const qualifier = toOptionalString(options.target);
          const payload = resolveOptionalPayloadInput({ payload: options.payload, file: options.file });

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在调用函数 ${functionName}...`,
            '❌ 函数调用失败',
            () => invokeFunction(functionName, { qualifier: qualifier || undefined, payload: payload || undefined })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 调用完成 (status=${result.statusCode})`));
          }
          const responseBody = result.body && result.body.trim().length > 0 ? result.body : '';
          if (isJsonOutput()) {
            emitCommandResult({
              component: component || null,
              functionName,
              qualifier: qualifier || null,
              statusCode: result.statusCode,
              body: responseBody
            });
            return;
          }
          console.log('');
          if (responseBody) {
            console.log(responseBody);
          } else {
            console.log('<empty response>');
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnRmCommand)
    .action(async (name: string | undefined, options: { component?: unknown; force?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          await ensureDestructiveActionConfirmed(
            options.force ? `删除函数 ${functionName}（含触发器/alias/版本）` : `删除函数 ${functionName}`,
            { yes: Boolean(options.yes) }
          );

          const s = createSpinner();
          const deleted = await withSpinner(
            s,
            options.force
              ? `正在级联清理并删除函数 ${functionName}...`
              : `正在删除函数 ${functionName}...`,
            '❌ 删除函数失败',
            () => removeFunction(functionName, { force: Boolean(options.force) })
          );
          if (!deleted) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 函数已删除'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              component: component || null,
              functionName,
              force: Boolean(options.force),
              forced: deleted.forced,
              deletedTriggers: deleted.deletedTriggers,
              deletedAliases: deleted.deletedAliases,
              deletedVersions: deleted.deletedVersions
            });
            return;
          }
          if (deleted.forced) {
            console.log(`\ncleanup: triggers=${deleted.deletedTriggers.length} aliases=${deleted.deletedAliases.length} versions=${deleted.deletedVersions.length}`);
          }
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnLogsCommand)
    .action(async (name: string | undefined, options: { component?: unknown; once?: unknown; window?: unknown; lines?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnLogsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'logs']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 📡 Function Log Stream ')));
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }

          const once = isJsonOutput() ? true : Boolean(options.once);
          const result = await tailLogs(functionName, {
            once,
            windowSeconds: parseOptionalPositiveInt(options.window, '--window'),
            lineLimit: parseOptionalPositiveInt(options.lines, '--lines'),
            silent: isJsonOutput()
          });

          if (isJsonOutput()) {
            emitCommandResult({
              stage: 'fn.logs',
              component: component || null,
              functionName,
              once,
              lines: result && 'lines' in result ? result.lines : [],
              count: result && 'logs' in result ? result.logs.length : 0
            });
          }
        }
      );
    });
}

export const fnCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerFnCommands,
  commands: [fnAliasesCommand, fnTriggersCommand, fnLayersCommand, fnCapacityCommand, fnInstancesCommand, fnSessionsCommand, fnVpcBindingsCommand, fnTagsCommand, fnListCommand, fnInfoCommand, fnInvokeCommand, fnRmCommand, fnLogsCommand],
  namespaces: {
    fn: {
      summary: '函数、函数日志与 FC 自定义域名的查看、详情、调用与删除。',
      examples: ['licell fn list', 'licell fn tags hello-world --output json', 'licell fn vpc-bindings hello-world --output json', 'licell fn capacity hello-world --output json', 'licell fn instances hello-world --output json', 'licell fn sessions hello-world --output json', 'licell fn aliases hello-world --output json', 'licell fn triggers hello-world --output json', 'licell fn layers --output json', 'licell fn info hello-world', 'licell fn logs hello-world --once --output json', 'licell fn domain list', 'licell fn invoke hello-world --output json']
    }
  },
  mergeBundles: [fnDomainCommandBundle]
});
