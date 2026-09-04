import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import type { CapabilitySearchOptions } from '../utils/alicloud-capabilities';
import type { GeneratedCapabilityAction } from '../utils/alicloud-capability-generator';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { findAlicloudCapabilityOverlay } from '../providers/openapi/overlay';

interface CapabilitySearchCliOptions {
  intent?: unknown;
  product?: unknown;
  action?: unknown;
  apiStyle?: unknown;
  method?: unknown;
  limit?: unknown;
  offset?: unknown;
}

interface ProductSearchCliOptions {
  limit?: unknown;
  offset?: unknown;
}

type CapabilityModule = typeof import('../utils/alicloud-capabilities');
type CapabilitySearchResult = ReturnType<CapabilityModule['searchAlicloudCapabilities']>;
type CapabilityDescribeResult = ReturnType<CapabilityModule['describeAlicloudCapability']>;
type ProductSearchResult = ReturnType<CapabilityModule['searchAlicloudProducts']>;

const PRODUCT_COMMAND_ROOTS: Record<string, string[]> = {
  fc: ['deploy', 'fn', 'task', 'env', 'logs', 'domain'],
  'fc-open': ['deploy', 'fn', 'task', 'env', 'logs', 'domain'],
  oss: ['oss'],
  ecs: ['ecs'],
  rds: ['db'],
  'r-kvstore': ['cache'],
  redis: ['cache'],
  sls: ['logs'],
  alidns: ['dns', 'domain'],
  cdn: ['domain'],
  cr: ['deploy'],
  ram: ['auth'],
  vpc: ['deploy', 'db', 'cache']
};

function capabilityWords(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => ({
      functions: 'fn',
      function: 'fn',
      databases: 'db',
      database: 'db',
      instances: 'instance',
      users: 'user',
      buckets: 'bucket',
      regions: 'region'
    }[word] || word))
    .filter(Boolean);
}

function rawInvokeCommand(result: CapabilityDescribeResult, mode: 'preview' | 'execute') {
  const capability = result.capability;
  const parameters = capability.parameters
    .filter((parameter) => parameter.required && parameter.name.toLowerCase() !== 'regionid')
    .map((parameter) => `--param ${parameter.name}=<${parameter.name}>`);
  const confirmation = capability.safety.level === 'safe'
    ? []
    : mode === 'preview' ? ['--dry-run'] : ['--yes'];
  return ['licell', 'api', 'invoke', capability.shorthand, ...parameters, ...confirmation, '--output', 'json'].join(' ');
}

export async function enrichDescribeForAgent(result: CapabilityDescribeResult) {
  const { buildAgentCommandCatalog } = await import('../utils/command-reference');
  const catalog = buildAgentCommandCatalog();
  const overlay = findAlicloudCapabilityOverlay(result.capability);
  const roots = new Set(PRODUCT_COMMAND_ROOTS[result.capability.product.directory.toLowerCase()] || []);
  const operationWords = new Set(capabilityWords(result.capability.operation));
  const candidates = (overlay
    ? overlay.commandKeys.flatMap((commandKey, index) => {
      const command = catalog.commands.find((entry) => entry.key === commandKey);
      return command ? [{ command, overlap: 1, score: 100 - index }] : [];
    })
    : catalog.commands
    .filter((command) => roots.has(command.rootCommand))
    .map((command) => {
      const commandWords = capabilityWords(command.key);
      const overlap = commandWords.filter((word) => operationWords.has(word)).length;
      const exactWordMatch = overlap === commandWords.length;
      const actionMatch = result.capability.action !== 'unknown' && commandWords.some((word) => (
        (result.capability.action === 'inspect' && ['info', 'list', 'logs'].includes(word))
        || (result.capability.action === 'create' && ['create', 'add', 'bind', 'start', 'upload', 'invoke'].includes(word))
        || (result.capability.action === 'update' && ['update', 'config', 'set', 'restart'].includes(word))
        || (result.capability.action === 'delete' && ['delete', 'rm', 'remove', 'unbind', 'stop'].includes(word))
        || (result.capability.action === 'execute' && ['invoke', 'run', 'trigger'].includes(word))
      ));
      return { command, overlap, score: overlap * 10 + (actionMatch ? 5 : 0) + (exactWordMatch ? 3 : 0) };
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((left, right) => right.score - left.score || left.command.key.localeCompare(right.command.key))
    .slice(0, 5)
    .map(({ command }) => ({
      key: command.key,
      invocation: command.invocation,
      description: command.description,
      safety: command.safety,
      helpCommand: `licell ${command.key} --help --output json`,
      match: overlay ? 'curated-overlay' : 'operation-heuristic'
    }));

  const fallback = {
    kind: 'raw-api' as const,
    capabilityRef: result.capability.ref,
    scaffoldCommand: `licell api scaffold ${result.capability.shorthand} --output json`,
    previewCommand: rawInvokeCommand(result, 'preview'),
    executeCommand: rawInvokeCommand(result, 'execute'),
    requiresConfirmation: result.capability.safety.level !== 'safe'
  };
  const hasCuratedCoverage = overlay !== undefined && candidates.length > 0;
  const execution = {
    policy: 'curated-first' as const,
    strategy: hasCuratedCoverage ? 'curated-command' as const : 'raw-api-fallback' as const,
    reason: hasCuratedCoverage
      ? '存在经过人工确认的 Licell 领域命令覆盖。'
      : '当前 catalog 没有经过人工确认的领域命令覆盖，使用 protocol 驱动的 raw API fallback。',
    preferred: hasCuratedCoverage ? {
      kind: 'curated-command' as const,
      commandKey: candidates[0]!.key,
      helpCommand: candidates[0]!.helpCommand,
      invocation: candidates[0]!.invocation
    } : fallback,
    fallback
  };
  const fallbackActions = [
    {
      title: '生成 raw API 模板',
      description: '需要补齐参数或审查 schema 时，生成 protocol 驱动的请求模板。',
      commandTemplate: fallback.scaffoldCommand,
      phase: 'inspect',
      priority: 'secondary',
      source: 'capability-describe'
    },
    {
      title: result.capability.safety.level === 'safe' ? '执行只读 raw API fallback' : '预览 raw API fallback',
      description: hasCuratedCoverage
        ? '领域命令无法满足需求时使用 protocol 驱动的 fallback。'
        : '当前没有确认覆盖的领域命令，按 capability schema 执行 fallback。',
      commandTemplate: fallback.previewCommand,
      phase: result.capability.safety.level === 'safe' ? 'inspect' : 'verify',
      priority: hasCuratedCoverage ? 'secondary' : 'primary',
      source: 'capability-describe'
    }
  ];

  const catalogRoot = candidates[0]
    ? catalog.commands.find((command) => command.key === candidates[0].key)?.rootCommand
    : undefined;
  const nextActions = result.nextActions
    .filter((action) => !action.commandTemplate.startsWith('licell catalog --root-command'));
  if (hasCuratedCoverage && catalogRoot) {
    nextActions.unshift({
      title: '优先查找 Licell 领域命令',
      description: 'raw metadata 没有完整业务语义，执行前先确认是否已有经过审核的领域命令。',
      commandTemplate: `licell catalog --root-command ${catalogRoot} --output json`,
      phase: 'inspect',
      priority: 'primary',
      source: 'capability-describe'
    });
  }

  return {
    ...result,
    curatedCommandCandidates: candidates,
    execution,
    nextActions: [
      ...nextActions,
      ...(hasCuratedCoverage ? [{
        title: '读取首选领域命令 help',
        description: '优先使用已有 Licell workflow 或资源命令，并读取其结构化契约。',
        commandTemplate: candidates[0].helpCommand,
        phase: 'inspect',
        priority: 'primary',
        source: 'capability-describe'
      }] : []),
      ...fallbackActions.sort((left, right) => (
        left.priority === right.priority ? 0 : left.priority === 'primary' ? -1 : 1
      ))
    ]
  };
}

const CAPABILITY_ACTIONS = new Set<GeneratedCapabilityAction>([
  'inspect',
  'create',
  'update',
  'delete',
  'execute',
  'unknown'
]);

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalInteger(value: unknown, name: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${name} 必须是整数`);
  return parsed;
}

function normalizeSearchOptions(query: string | undefined, options: CapabilitySearchCliOptions): CapabilitySearchOptions {
  const action = optionalString(options.action);
  if (action && !CAPABILITY_ACTIONS.has(action as GeneratedCapabilityAction)) {
    throw new Error(`--action 不支持 ${action}；可选: ${[...CAPABILITY_ACTIONS].join(', ')}`);
  }
  const apiStyle = optionalString(options.apiStyle);
  if (apiStyle && apiStyle !== 'rpc' && apiStyle !== 'restful') {
    throw new Error(`--api-style 不支持 ${apiStyle}；可选: rpc, restful`);
  }
  return {
    query: optionalString(query),
    intent: optionalString(options.intent),
    product: optionalString(options.product),
    action: action as GeneratedCapabilityAction | undefined,
    apiStyle,
    method: optionalString(options.method),
    limit: optionalInteger(options.limit, '--limit'),
    offset: optionalInteger(options.offset, '--offset')
  };
}

const capabilityProductsCommand = defineCliCommand({
  rawName: 'capability products [query]',
  regionExclusion: 'local',
  description: '列出 protocol 快照覆盖的阿里云产品和 capability 数量',
  options: [
    { rawName: '--limit <n>', description: '最多返回多少个产品；默认 50，最大 200' },
    { rawName: '--offset <n>', description: '结果偏移量；默认 0' }
  ],
  descriptor: {
    title: 'Discover Alibaba Cloud products',
    summary: '离线列出 protocol 快照覆盖的全部阿里云产品；用于从服务名称进入 capability 搜索。',
    notes: [
      '产品 code、中英文名、API 风格和 capability 数量均来自固定的 protocol 快照。',
      'query 支持产品 code、官方中英文名和常见云产品术语。'
    ],
    examples: [
      'licell capability products --output json',
      'licell capability products kubernetes --output json',
      'licell capability products 日志服务 --output json'
    ],
    argumentHints: {
      query: '可使用产品 code、官方名称或常见术语，如 `ecs`、`对象存储`、`k8s`。'
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['[query]', '--limit', '--offset'],
      notes: ['读取 `products[].searchCommand` 进入选定产品的 operation 能力空间。']
    },
    safety: {
      level: 'safe',
      reason: '只读取构建时嵌入的本地产品索引，不发起网络请求。',
      confirmFlags: []
    },
    result: {
      summary: '返回 protocol 覆盖的产品、版本、API 风格和 capability 数量。',
      outcomeKey: 'products',
      fields: [
        { name: 'documentKind', description: '固定为 `licell-alicloud-product-search`。', required: true },
        { name: 'source', description: 'protocol schema、metadata commit 和快照 hash。', required: true },
        { name: 'products[]', description: '产品目录名、code、中英文名、版本、API 风格和 API 数量。', required: true },
        { name: 'products[].searchCommand', description: '搜索该产品全部 capability 的下一条命令。', required: true },
        { name: 'nextActions[]', description: '进入首个匹配产品 capability 空间的机器可读动作。', required: true }
      ]
    }
  }
});

const capabilitySearchCommand = defineCliCommand({
  rawName: 'capability search [query]',
  regionExclusion: 'local',
  description: '从仓库内阿里云 OpenAPI 快照搜索原始 capability',
  options: [
    { rawName: '--intent <text>', description: '按自然语言意图搜索；可与 query 合并' },
    { rawName: '--product <code>', description: '按产品目录名或产品 code 过滤，如 vpc / Ecs' },
    { rawName: '--action <action>', description: '按推断动作过滤：inspect|create|update|delete|execute|unknown' },
    { rawName: '--api-style <style>', description: '按 API 风格过滤：rpc|restful' },
    { rawName: '--method <method>', description: '按 HTTP method 过滤，如 GET / POST' },
    { rawName: '--limit <n>', description: '最多返回多少条；默认 20，最大 100' },
    { rawName: '--offset <n>', description: '结果偏移量；默认 0' }
  ],
  descriptor: {
    title: 'Search Alibaba Cloud capabilities',
    summary: '离线搜索 protocol 快照生成的阿里云 OpenAPI capability；用于发现尚未进入 Licell 领域命令的底层能力。',
    notes: [
      '索引来自仓库内 `protocol/alicloud-openapi`，命令不会联网，也不会调用云端 API。',
      '返回项统一标记 `maturity=raw`；`action` 和 `safetyHint` 来自名称启发式推断，不代表已经完成领域审核。'
    ],
    examples: [
      'licell capability search "CreateVpc" --output json',
      'licell capability search --intent "创建 VPC" --output json',
      'licell capability search --product ecs --action inspect --limit 20 --output json'
    ],
    argumentHints: {
      query: '可使用 operation、产品名、产品 code 或英文关键词，例如 `CreateVpc`、`ecs instance`。'
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['[query]', '--intent', '--product', '--action', '--limit'],
      notes: ['Agent 应先消费 `capabilities[].ref`，再调用 `capability describe <ref>` 获取完整输入 schema。']
    },
    safety: {
      level: 'safe',
      reason: '只读取构建时嵌入的本地 capability 索引，不发起网络请求。',
      confirmFlags: []
    },
    optionInsights: {
      '--intent': {
        whenToUse: '只有目标意图、还不知道阿里云 operation 名称时使用。',
        cautions: ['当前中文动词映射和 operation 拆词只是检索辅助，不是语义审核。']
      },
      '--action': {
        whenToUse: '需要把只读查询、创建、更新或删除候选分开时使用。',
        cautions: ['动作由 operation 名称前缀推断，结果必须结合 describe 和领域命令复核。']
      },
      '--limit': {
        whenToUse: '限制 Agent 上下文中的候选数量时使用。',
        cautions: ['最大值为 100；通过 `offset` 读取后续结果。']
      }
    },
    recommendedFlow: [
      { title: '搜索底层能力', command: 'licell capability search --intent "创建 VPC" --output json', reason: '从本地 protocol 索引取得稳定 capability ref。' },
      { title: '读取完整定义', command: 'licell capability describe vpc.CreateVpc --output json', reason: '检查输入 schema、transport、来源和 raw 限制。' },
      { title: '优先查领域命令', command: 'licell catalog --output json', reason: '实际执行前优先选择经过审核的 Licell workflow 或领域命令。' }
    ],
    result: {
      summary: '返回匹配的 raw capability 摘要、分页信息、协议来源和使用限制。',
      outcomeKey: 'capabilities',
      fields: [
        { name: 'documentKind', description: '固定为 `licell-alicloud-capability-search`；外层 CLI record 的 kind 仍为 `licell-cli-record`。', required: true },
        { name: 'documentSchemaVersion', description: 'capability 搜索结果 schema 版本。', required: true },
        { name: 'source', description: 'protocol schema、metadata commit 和快照 hash。', required: true },
        { name: 'query', description: '规范化后的查询与过滤条件。', required: true },
        { name: 'total', description: '过滤后总匹配数。', required: true },
        { name: 'count', description: '本页返回数。', required: true },
        { name: 'truncated', description: '是否还有后续结果。', required: true },
        { name: 'capabilities[]', description: '候选 capability 摘要；包含 ref、operation、maturity、safetyHint 和 describeCommand。', required: true },
        { name: 'nextActions[]', description: '查看首个匹配 capability 完整执行定义的机器可读动作。', required: true },
        { name: 'limitations[]', description: 'raw metadata 的语义限制。', required: true }
      ]
    },
    agentTips: [
      '不要把 `safetyHint=safe` 当成正式执行授权；该字段只用于缩小候选范围。',
      '优先以 `ref` 作为稳定标识，并在执行任何云端变更前查找相应 Licell 领域命令。'
    ]
  }
});

const capabilityDescribeCommand = defineCliCommand({
  rawName: 'capability describe <ref>',
  regionExclusion: 'local',
  description: '查看一个 raw capability 的完整 OpenAPI 输入和来源',
  descriptor: {
    title: 'Describe an Alibaba Cloud capability',
    summary: '按稳定 ref 或 product.Operation shorthand 返回原始 OpenAPI 参数、endpoint、来源和安全提示。',
    notes: [
      '支持 `alicloud:vpc:CreateVpc` 和 `vpc.CreateVpc` 两种引用格式，不区分大小写。',
      '结果仍是 raw capability；缺少响应 schema、幂等性、前置条件和回滚策略。'
    ],
    examples: [
      'licell capability describe vpc.CreateVpc --output json',
      'licell capability describe alicloud:ecs:DescribeInstances --output json'
    ],
    argumentHints: {
      ref: '使用 search 返回的 `ref` 或 `shorthand`，如 `alicloud:vpc:CreateVpc` / `vpc.CreateVpc`。'
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['<ref>'],
      notes: ['优先读取 `capability.inputSchema`、`capability.safety`、`capability.provenance` 和 `limitations[]`。']
    },
    safety: {
      level: 'safe',
      reason: '只读取构建时嵌入的本地 capability 索引，不发起网络请求。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '先搜索 capability', command: 'licell capability search <query> --output json', reason: '取得准确的 ref，避免猜测 operation 名称。' },
      { title: '查看完整定义', command: 'licell capability describe <ref> --output json', reason: '读取输入、endpoint、来源与风险提示。' },
      { title: '查找领域命令', command: 'licell catalog --output json', reason: '执行前优先使用 curated workflow。' }
    ],
    result: {
      summary: '返回一个 raw capability 的完整本地定义。',
      outcomeKey: 'capability',
      fields: [
        { name: 'documentKind', description: '固定为 `licell-alicloud-capability`；外层 CLI record 的 kind 仍为 `licell-cli-record`。', required: true },
        { name: 'documentSchemaVersion', description: 'capability 文档 schema 版本。', required: true },
        { name: 'source', description: 'protocol 与 metadata 来源。', required: true },
        { name: 'capability.ref', description: '稳定 capability 引用。', required: true },
        { name: 'capability.maturity', description: '当前固定为 `raw`。', required: true },
        { name: 'capability.product', description: '产品、版本、API 风格和 endpoint 信息。', required: true },
        { name: 'capability.operation', description: '阿里云 OpenAPI operation 名称。', required: true },
        { name: 'capability.inputSchema', description: '由 metadata 参数生成的输入 object schema。', required: true },
        { name: 'capability.safety', description: '启发式安全提示及置信度。', required: true },
        { name: 'capability.provenance', description: 'metadata 路径、commit 和快照 hash。', required: true },
        { name: 'curatedCommandCandidates[]', description: '从当前 catalog 匹配的 Licell 领域命令候选；优先使用人工 overlay，未覆盖时才使用 operation 词项启发式。为空时使用 raw fallback。', required: true },
        { name: 'curatedCommandCandidates[].match', description: '匹配来源：`curated-overlay` 或 `operation-heuristic`；只有前者代表已人工确认的 operation 覆盖关系。', required: true },
        { name: 'execution', description: '机器可读执行决策；明确选择 curated command 或 raw API fallback。', required: true },
        { name: 'execution.policy', description: '固定为 `curated-first`。', required: true },
        { name: 'execution.strategy', description: '`curated-command` 或 `raw-api-fallback`。', required: true },
        { name: 'execution.preferred', description: '首选执行面及可直接使用的 help/invoke 命令。', required: true },
        { name: 'execution.fallback', description: 'protocol 驱动的 scaffold、preview、execute 命令。', required: true },
        { name: 'nextActions[]', description: '优先查找 Licell 领域命令的后续动作。', required: true },
        { name: 'limitations[]', description: 'raw capability 的明确限制。', required: true }
      ]
    }
  }
});

function renderSearchText(result: CapabilitySearchResult) {
  const lines = [
    `source: ${result.source.metadataCommit}`,
    `matched: ${result.total}`,
    `showing: ${result.count}${result.truncated ? ' (truncated)' : ''}`
  ];
  for (const capability of result.capabilities) {
    lines.push(
      `${pc.cyan(capability.shorthand)}  action=${capability.action}  safety=${capability.safetyHint}  params=${capability.parameterCount}`
    );
  }
  if (result.capabilities.length === 0) lines.push('未找到匹配 capability。');
  return `${lines.join('\n')}\n`;
}

function renderProductsText(result: ProductSearchResult) {
  const lines = [
    `source: ${result.source.metadataCommit}`,
    `matched: ${result.total}`,
    `showing: ${result.count}${result.truncated ? ' (truncated)' : ''}`
  ];
  for (const product of result.products) {
    lines.push(`${pc.cyan(product.directory)}  ${product.name.zh || product.name.en}  apis=${product.apiCount}`);
  }
  if (result.products.length === 0) lines.push('未找到匹配产品。');
  return `${lines.join('\n')}\n`;
}

function renderDescribeText(result: CapabilityDescribeResult) {
  const capability = result.capability;
  const required = capability.inputSchema.required;
  return [
    `ref:       ${pc.cyan(capability.ref)}`,
    `product:   ${capability.product.code} ${capability.product.version}`,
    `operation: ${capability.operation}`,
    `transport: ${capability.apiStyle} ${capability.method} ${capability.pathPattern || '/'}`,
    `maturity:  ${pc.yellow(capability.maturity)}`,
    `safety:    ${capability.safety.level} (${capability.safety.confidence})`,
    `params:    ${capability.parameters.length}; required=${required.length > 0 ? required.join(', ') : '-'}`,
    `source:    ${capability.provenance.metadataPath}@${capability.provenance.metadataCommit}`,
    '',
    'next: licell catalog --output json'
  ].join('\n') + '\n';
}

export function registerCapabilityCommands(cli: CAC) {
  registerCliCommand(cli, capabilityProductsCommand)
    .action(async (query: string | undefined, options: ProductSearchCliOptions) => {
      try {
        const { searchAlicloudProducts } = await import('../utils/alicloud-capabilities');
        const result = searchAlicloudProducts({
          query: optionalString(query),
          limit: optionalInteger(options.limit, '--limit'),
          offset: optionalInteger(options.offset, '--offset')
        });
        if (isJsonOutput()) emitCommandResult(result, { stage: 'capability', inferOutcome: false });
        else process.stdout.write(renderProductsText(result));
      } catch (error) {
        if (isJsonOutput()) emitCliError(error, { stage: 'capability' });
        else console.error(formatErrorMessage(error));
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, capabilitySearchCommand)
    .action(async (query: string | undefined, options: CapabilitySearchCliOptions) => {
      try {
        const { searchAlicloudCapabilities } = await import('../utils/alicloud-capabilities');
        const result = searchAlicloudCapabilities(normalizeSearchOptions(query, options));
        if (isJsonOutput()) emitCommandResult(result, { stage: 'capability', inferOutcome: false });
        else process.stdout.write(renderSearchText(result));
      } catch (error) {
        if (isJsonOutput()) emitCliError(error, { stage: 'capability' });
        else console.error(formatErrorMessage(error));
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, capabilityDescribeCommand)
    .action(async (ref: string) => {
      try {
        const { describeAlicloudCapability } = await import('../utils/alicloud-capabilities');
        const result = await enrichDescribeForAgent(describeAlicloudCapability(ref));
        if (isJsonOutput()) emitCommandResult(result, { stage: 'capability', inferOutcome: false });
        else process.stdout.write(renderDescribeText(result));
      } catch (error) {
        if (isJsonOutput()) emitCliError(error, { stage: 'capability' });
        else console.error(formatErrorMessage(error));
        process.exitCode = 1;
      }
    });
}

export const capabilityCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerCapabilityCommands,
  namespaces: {
    capability: {
      summary: '离线发现阿里云 OpenAPI protocol capability；搜索和描述不会调用云端 API。',
      examples: [
        'licell capability products kubernetes --output json',
        'licell capability search --intent "创建 VPC" --output json',
        'licell capability describe vpc.CreateVpc --output json'
      ],
      agentTips: [
        '先用 products/search/describe 缩小能力空间，再按 describe.execution 选择领域命令或 raw fallback。'
      ]
    }
  },
  commands: [capabilityProductsCommand, capabilitySearchCommand, capabilityDescribeCommand]
});
