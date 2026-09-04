import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { buildAlicloudApiScaffold, executeAlicloudApi } from '../providers/openapi/runner';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { formatErrorMessage } from '../utils/errors';
import { describeAlicloudCapability } from '../utils/alicloud-capabilities';

interface ApiInvokeOptions {
  paramsFile?: unknown;
  param?: unknown;
  region?: unknown;
  endpoint?: unknown;
  endpointType?: unknown;
  header?: unknown;
  dryRun?: unknown;
  yes?: unknown;
  force?: unknown;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isTruthy(value: unknown) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function parseParamValue(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function assignPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error('--param 的 key 不能为空');
  const numericPart = (part: string) => /^\d+$/.test(part);
  let cursor: unknown = target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    const last = index === parts.length - 1;
    if (Array.isArray(cursor)) {
      if (!numericPart(part) || Number(part) < 1) throw new Error(`--param 数组索引必须是从 1 开始的正整数: ${part}`);
      const itemIndex = Number(part) - 1;
      if (last) {
        cursor[itemIndex] = value;
        return;
      }
      const wantsArray = numericPart(parts[index + 1]!);
      const child = cursor[itemIndex];
      if (!child || typeof child !== 'object' || (wantsArray && !Array.isArray(child)) || (!wantsArray && Array.isArray(child))) {
        cursor[itemIndex] = wantsArray ? [] : {};
      }
      cursor = cursor[itemIndex];
      continue;
    }
    if (!cursor || typeof cursor !== 'object' || numericPart(part)) throw new Error(`--param 路径无效: ${path}`);
    const record = cursor as Record<string, unknown>;
    if (last) {
      record[part] = value;
      return;
    }
    const wantsArray = numericPart(parts[index + 1]!);
    const child = record[part];
    if (!child || typeof child !== 'object' || (wantsArray && !Array.isArray(child)) || (!wantsArray && Array.isArray(child))) {
      record[part] = wantsArray ? [] : {};
    }
    cursor = record[part];
  }
}

function parseParams(options: ApiInvokeOptions) {
  const result: Record<string, unknown> = {};
  const paramsFile = optionalString(options.paramsFile);
  if (paramsFile) {
    const parsed = JSON.parse(readFileSync(paramsFile, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('--params-file 必须是 JSON object');
    Object.assign(result, parsed);
  }
  const params = Array.isArray(options.param) ? options.param : options.param ? [options.param] : [];
  for (const raw of params) {
    if (typeof raw !== 'string') throw new Error('--param 格式必须是 key=value');
    const separator = raw.indexOf('=');
    if (separator <= 0) throw new Error('--param 格式必须是 key=value');
    assignPath(result, raw.slice(0, separator), parseParamValue(raw.slice(separator + 1)));
  }
  return result;
}

function parseHeaders(options: ApiInvokeOptions) {
  const headers: Record<string, string> = {};
  const values = Array.isArray(options.header) ? options.header : options.header ? [options.header] : [];
  for (const raw of values) {
    if (typeof raw !== 'string') throw new Error('--header 格式必须是 name=value');
    const separator = raw.indexOf('=');
    if (separator <= 0) throw new Error('--header 格式必须是 name=value');
    const name = raw.slice(0, separator).trim();
    if (!name) throw new Error('--header 的 name 不能为空');
    headers[name] = raw.slice(separator + 1);
  }
  return headers;
}

const apiScaffoldCommand = defineCliCommand({
  rawName: 'api scaffold <ref>',
  regionExclusion: 'local',
  description: '从 raw capability 生成 API 请求模板',
  descriptor: {
    title: 'Generate an Alibaba Cloud API request scaffold',
    summary: '根据本地 protocol capability 生成可审查的请求参数模板，不发起云端请求。',
    examples: [
      'licell api scaffold vpc.CreateVpc --output json',
      'licell api scaffold ecs.DescribeInstances --output json'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['<ref>'] },
    safety: { level: 'safe', reason: '只读取本地 capability 索引并生成请求模板。', confirmFlags: [] },
    recommendedFlow: [
      { title: '描述 capability', command: 'licell capability describe <ref> --output json', reason: '先确认参数和 raw 限制。' },
      { title: '生成请求模板', command: 'licell api scaffold <ref> --output json', reason: '将参数模板写入请求文件后再 dry-run。' },
      { title: '预览调用计划', command: 'licell api invoke <ref> --params-file request.json --dry-run --output json', reason: '确认 runner、endpoint 和参数映射。' }
    ],
    result: {
      summary: '返回请求模板、capability 来源和 dry-run 调用示例。',
      outcomeKey: 'template',
      fields: [
        { name: 'documentKind', description: '固定为 `licell-alicloud-api-scaffold`。', required: true },
        { name: 'capability', description: '原始 capability 定义。', required: true },
        { name: 'template', description: '可编辑的 JSON 请求参数模板。', required: true },
        { name: 'invocation', description: '推荐的 dry-run 调用命令。', required: true }
      ]
    }
  }
});

const apiInvokeCommand = defineCliCommand({
  rawName: 'api invoke <ref>',
  region: { scope: 'auth' },
  description: '通过固定版本 aliyun-cli runner 调用 raw API',
  options: [
    { rawName: '--region <regionId>', description: '本次调用地域；不传则使用 licell 默认 region' },
    { rawName: '--params-file <path>', description: '从 JSON object 文件读取请求参数' },
    { rawName: '--param <key=value>', description: '追加或覆盖参数；名称按 protocol 匹配，兼容 CamelCase/kebab-case/snake_case，可重复' },
    { rawName: '--endpoint <endpoint>', description: '显式覆盖产品 endpoint' },
    { rawName: '--endpoint-type <type>', description: 'endpoint 类型，如 public / vpc' },
    { rawName: '--header <name=value>', description: '追加 HTTP header；可重复传入' },
    { rawName: '--dry-run', description: '只输出 runner 调用计划，不发起云端请求' },
    { rawName: '--yes', description: '确认执行 raw 写操作' },
    { rawName: '--force', description: '保留给 runner 的本地 metadata 校验覆盖选项' }
  ],
  descriptor: {
    title: 'Invoke an Alibaba Cloud raw API',
    summary: '通过固定版本 aliyun-cli runner 执行 protocol 中的 raw RPC/REST API；不替代 Licell 领域 workflow。',
    notes: [
      '执行前应先用 `capability search/describe` 和 `catalog` 查找经过审核的领域命令。',
      'AK/SK 通过子进程环境变量传递，不进入 argv；stdout/stderr 会保留在结构化结果中。',
      '优先复用 PATH 中的 aliyun；缺失时下载固定版本并校验 SHA-256，缓存到 `~/.licell/bin`。',
      '参数按 protocol 的 Path/Query/Header/Body 位置编译；Path 段会 URL 编码并替换模板，未知或缺失的必填参数会在调用前报错。',
      'Licell 的 `--output json` 只控制外层 CLI record；不会透传为 aliyun-cli 的 `--output json`（上游该选项仅支持 `cols=...` 表格过滤）。',
      '当前 raw API 不包含业务幂等性、回滚和状态验证语义。',
      'Kubernetes KubeConfig 等敏感响应只允许 Licell 内部 workflow 消费；generic raw invoke 会返回结构化阻断和安全替代路径。'
    ],
    examples: [
      'licell api invoke vpc.DescribeVpcs --param RegionId=cn-hangzhou --dry-run --output json',
      'licell api invoke cs.DescribeClusterDetail --param cluster-id=<clusterId> --output json',
      'licell api invoke ecs.DescribeInstances --params-file request.json --output json',
      'licell api invoke vpc.CreateVpc --params-file request.json --yes --output json'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['<ref>', '--params-file', '--param', '--region', '--endpoint', '--endpoint-type', '--header', '--dry-run', '--yes'],
      notes: ['Agent 只能把 raw invoke 作为无领域命令时的 fallback；执行写操作前必须显式 dry-run 或 --yes。']
    },
    safety: {
      level: 'mutating',
      reason: 'raw API 可能创建、修改或删除云端资源；必须先 dry-run 或显式确认。',
      confirmFlags: ['--yes', '--dry-run']
    },
    result: {
      summary: '返回 runner 执行状态、原始响应、requestId 和脱敏后的调用计划。',
      outcomeKey: 'response',
      fields: [
        { name: 'ok', description: 'runner 是否以零退出码完成。', required: true },
        { name: 'response', description: 'runner stdout 解析后的原始 API 响应。', required: true },
        { name: 'requestId', description: '从响应中提取的 requestId。' },
        { name: 'plan', description: 'runner、argv、解析后的 REST requestPath、endpoint 和参数映射计划。', required: true },
        { name: 'maturity', description: '固定为 `raw`。', required: true }
      ]
    }
  }
});

function renderScaffold(result: ReturnType<typeof buildAlicloudApiScaffold>) {
  return [
    `ref: ${pc.cyan(result.capability.shorthand)}`,
    `operation: ${result.capability.operation}`,
    '',
    JSON.stringify(result.template, null, 2),
    '',
    `next: ${result.invocation}`,
    ''
  ].join('\n');
}

function renderInvoke(result: Awaited<ReturnType<typeof executeAlicloudApi>>) {
  return [
    `status: ${result.ok ? pc.green('ok') : pc.red('failed')}`,
    `operation: ${result.plan.product}.${result.plan.operation}`,
    `runner: ${result.plan.runner}`,
    `endpoint: ${result.plan.endpoint || '-'}`,
    `exitCode: ${result.exitCode}`,
    ...(result.requestId ? [`requestId: ${result.requestId}`] : []),
    result.response === null ? '' : JSON.stringify(result.response, null, 2),
    result.stderr ? `stderr: ${result.stderr.trim()}` : ''
  ].filter(Boolean).join('\n') + '\n';
}

export function registerApiCommands(cli: CAC) {
  registerCliCommand(cli, apiScaffoldCommand).action((ref: string) => {
    try {
      const result = buildAlicloudApiScaffold(ref);
      if (isJsonOutput()) emitCommandResult(result, { stage: 'api', inferOutcome: false });
      else process.stdout.write(renderScaffold(result));
    } catch (error) {
      if (isJsonOutput()) emitCliError(error, { stage: 'api' });
      else console.error(formatErrorMessage(error));
      process.exitCode = 1;
    }
  });

  registerCliCommand(cli, apiInvokeCommand).action(async (ref: string, options: ApiInvokeOptions) => {
    try {
      const described = describeAlicloudCapability(ref);
      const dryRun = isTruthy(options.dryRun);
      const confirmed = isTruthy(options.yes);
      if (!dryRun && described.capability.safety.level !== 'safe' && !confirmed) {
        throw new Error('raw 写操作默认只允许 --dry-run；确认执行请追加 --yes');
      }
      const result = await executeAlicloudApi(ref, parseParams(options), {
        region: optionalString(options.region),
        endpoint: optionalString(options.endpoint),
        endpointType: optionalString(options.endpointType),
        headers: parseHeaders(options),
        dryRun,
        force: isTruthy(options.force)
      });
      if (!result.ok) {
        const error = new Error(result.stderr.trim() || `aliyun-cli runner exited with code ${result.exitCode}`);
        if (isJsonOutput()) emitCliError(error, { stage: 'api', details: { result } });
        else process.stderr.write(renderInvoke(result));
        process.exitCode = 1;
        return;
      }
      if (isJsonOutput()) emitCommandResult(result, { stage: 'api', inferOutcome: false });
      else process.stdout.write(renderInvoke(result));
    } catch (error) {
      if (isJsonOutput()) emitCliError(error, { stage: 'api' });
      else console.error(formatErrorMessage(error));
      process.exitCode = 1;
    }
  });
}

export const apiCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerApiCommands,
  namespaces: {
    api: {
      summary: '通过固定版本 aliyun-cli runner 调用 raw OpenAPI；优先使用 Licell 领域 workflow。',
      examples: [
        'licell api scaffold vpc.CreateVpc --output json',
        'licell api invoke vpc.DescribeVpcs --dry-run --output json'
      ],
      agentTips: [
        'api invoke 是 raw fallback，不代表对应 API 已晋级为 Licell curated capability。',
        '不要把 raw API 的 [REDACTED] 敏感字段当作后续命令的输入；优先使用对应的 Licell 原生命令。'
      ]
    }
  },
  commands: [apiScaffoldCommand, apiInvokeCommand]
});
