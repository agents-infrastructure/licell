import { access, constants as fsConstants } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { Config, type AuthConfig } from '../../utils/config';
import { describeAlicloudCapability } from '../../utils/alicloud-capabilities';
import type { GeneratedCapabilityParameter } from '../../utils/alicloud-capability-generator';
import { ensureAlicloudRunner, findExecutableOnPath } from './runner-manager';

export interface OpenApiRunnerContext {
  region?: string;
  endpoint?: string;
  endpointType?: string;
  dryRun?: boolean;
  force?: boolean;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  runnerPath?: string;
  env?: Record<string, string | undefined>;
  spawnProcess?: SpawnProcess;
  /** Internal consumers only. Generic `api invoke` must keep sensitive response fields redacted. */
  exposeSensitiveResponse?: boolean;
}

export interface OpenApiRunnerPlan {
  runner: string;
  args: string[];
  envKeys: string[];
  product: string;
  operation: string;
  apiStyle: string;
  method: string;
  requestPath: string | null;
  endpoint: string | null;
}

export interface OpenApiRunnerResult {
  ok: boolean;
  exitCode: number;
  signal: string | null;
  stdout: string;
  stderr: string;
  response: unknown;
  requestId?: string;
  plan: OpenApiRunnerPlan;
  maturity: 'raw';
}

/**
 * KubeConfig is an internal transport credential. Generic raw invocation must
 * fail before a redacted response can be mistaken for usable kubectl input.
 */
export class SensitiveResponseAccessError extends Error {
  readonly code = 'SENSITIVE_RESPONSE_BLOCKED';
  readonly details: { operationRef: string; safeRoute: string; sensitiveFields: string[] };

  constructor(operationRef: string, sensitiveFields: string[]) {
    super(
      `raw API ${operationRef} 返回仅供 Licell 内部使用的敏感字段；` +
      '该响应不能传递给 Agent 或 kubectl，请使用对应的 Licell 原生命令。'
    );
    this.name = 'SensitiveResponseAccessError';
    this.details = {
      operationRef,
      safeRoute: 'k8s workloads',
      sensitiveFields
    };
  }
}

export type SpawnProcess = (
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv }
) => Promise<{ exitCode: number; signal: string | null; stdout: string; stderr: string }>;

export interface ResolveAlicloudRunnerOptions {
  env?: NodeJS.ProcessEnv;
  ensureRunner?: () => Promise<string>;
}

function scalarArgs(name: string, value: unknown) {
  if (value === undefined || value === null) return [];
  if (typeof value === 'boolean') return [`--${name}`, value ? 'true' : 'false'];
  if (typeof value === 'string' || typeof value === 'number') return [`--${name}`, String(value)];
  return [`--${name}`, JSON.stringify(value)];
}

function appendParameterArgs(args: string[], name: string, value: unknown, parameter?: GeneratedCapabilityParameter) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (parameter?.subParameters?.length && item && typeof item === 'object' && !Array.isArray(item)) {
        for (const child of parameter.subParameters) {
          appendParameterArgs(args, `${name}.${index + 1}.${child.name}`, (item as Record<string, unknown>)[child.name], child);
        }
      } else {
        args.push(...scalarArgs(name, item));
      }
    });
    return;
  }
  if (parameter?.subParameters?.length && typeof value === 'object') {
    for (const child of parameter.subParameters) {
      appendParameterArgs(args, `${name}.${child.name}`, (value as Record<string, unknown>)[child.name], child);
    }
    return;
  }
  args.push(...scalarArgs(name, value));
}

function normalizedParameterName(name: string) {
  return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isProvided(value: unknown) {
  return value !== undefined && value !== null;
}

function normalizeInputParameters(
  parameters: GeneratedCapabilityParameter[],
  input: Record<string, unknown>,
  region: string
) {
  const byExactName = new Map(parameters.map((parameter) => [parameter.name, parameter]));
  const byNormalizedName = new Map<string, GeneratedCapabilityParameter[]>();
  for (const parameter of parameters) {
    const normalized = normalizedParameterName(parameter.name);
    byNormalizedName.set(normalized, [...(byNormalizedName.get(normalized) || []), parameter]);
  }

  const values = new Map<string, unknown>();
  const explicitNames = new Set<string>();
  for (const [inputName, value] of Object.entries(input)) {
    const aliases = byNormalizedName.get(normalizedParameterName(inputName)) || [];
    const parameter = byExactName.get(inputName) || (aliases.length === 1 ? aliases[0] : undefined);
    if (!byExactName.has(inputName) && aliases.length > 1) {
      throw new Error(`API 参数名有歧义: ${inputName}；请使用精确名称: ${aliases.map((item) => item.name).join(', ')}`);
    }
    if (!parameter) {
      const available = parameters.map((item) => item.name).join(', ');
      throw new Error(`未知 API 参数: ${inputName}${available ? `；可用参数: ${available}` : ''}`);
    }
    if (values.has(parameter.name)) {
      throw new Error(`API 参数重复: ${parameter.name}`);
    }
    values.set(parameter.name, value);
    explicitNames.add(parameter.name);
  }

  // The runner's global --region flag supplies RegionId when callers omit it.
  const regionAliases = byNormalizedName.get('regionid') || [];
  const regionParameter = regionAliases.length === 1 ? regionAliases[0] : undefined;
  if (regionParameter && !values.has(regionParameter.name)) values.set(regionParameter.name, region);

  const missing = parameters
    .filter((parameter) => parameter.required && !isProvided(values.get(parameter.name)))
    .map((parameter) => parameter.name);
  if (missing.length > 0) throw new Error(`缺少必填 API 参数: ${missing.join(', ')}`);

  return { byNormalizedName, explicitNames, values };
}

function encodePathSegment(value: unknown, name: string) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new Error(`Path 参数 ${name} 必须是 string、number 或 boolean`);
  }
  if (String(value).length === 0) throw new Error(`Path 参数 ${name} 不能为空`);
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}

function resolveRestPath(
  pathPattern: string,
  parametersByNormalizedName: Map<string, GeneratedCapabilityParameter[]>,
  values: Map<string, unknown>
) {
  const consumedParameters = new Set<string>();
  const requestPath = pathPattern.replace(/\[([^\]]+)\]/g, (_placeholder, placeholderName: string) => {
    const candidates = (parametersByNormalizedName.get(normalizedParameterName(placeholderName)) || [])
      .filter((parameter) => parameter.position.toLowerCase() === 'path');
    const parameter = candidates.find((candidate) => candidate.name === placeholderName)
      || (candidates.length === 1 ? candidates[0] : undefined);
    if (!parameter) {
      throw new Error(`protocol Path 占位符没有对应参数: ${placeholderName}`);
    }
    const value = values.get(parameter.name);
    if (!isProvided(value)) throw new Error(`缺少必填 API 参数: ${parameter.name}`);
    consumedParameters.add(parameter.name);
    return encodePathSegment(value, parameter.name);
  });
  return { consumedParameters, requestPath };
}

function buildRunnerArgs(
  capability: ReturnType<typeof describeAlicloudCapability>['capability'],
  input: Record<string, unknown>,
  context: OpenApiRunnerContext
) {
  const isRestful = capability.apiStyle.toLowerCase() === 'restful';
  const region = context.region || 'cn-hangzhou';
  const normalizedInput = normalizeInputParameters(capability.parameters, input, region);
  const resolvedPath = isRestful
    ? resolveRestPath(capability.pathPattern, normalizedInput.byNormalizedName, normalizedInput.values)
    : null;
  const requestPath = resolvedPath?.requestPath || null;
  const args = isRestful
    ? [capability.product.directory, capability.method.split('|')[0] || 'GET', requestPath!]
    : [capability.product.directory, capability.operation];
  const parameterByName = new Map(capability.parameters.map((parameter) => [parameter.name, parameter]));
  const body: Record<string, unknown> = {};
  let rawBody: unknown;

  for (const [name, value] of normalizedInput.values) {
    const parameter = parameterByName.get(name);
    if (resolvedPath?.consumedParameters.has(name)) continue;
    if (normalizedParameterName(name) === 'regionid' && !normalizedInput.explicitNames.has(name)) continue;
    if (parameter?.position.toLowerCase() === 'body') {
      if (name.toLowerCase() === 'body') rawBody = value;
      else body[name] = value;
      continue;
    }
    appendParameterArgs(args, name, value, parameter);
  }

  if (rawBody !== undefined) args.push('--body', typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
  else if (Object.keys(body).length > 0) args.push('--body', JSON.stringify(body));
  args.push('--region', region);
  if (context.endpoint) args.push('--endpoint', context.endpoint);
  if (context.endpointType) args.push('--endpoint-type', context.endpointType);
  for (const [name, value] of Object.entries(context.headers || {})) args.push('--header', `${name}=${value}`);
  if (context.force) args.push('--force');
  return { args, requestPath };
}

export async function resolveAlicloudRunner(
  explicitPath?: string,
  options: ResolveAlicloudRunnerOptions = {}
) {
  const env = options.env || process.env;
  const configuredPath = explicitPath || env.LICELL_ALIYUN_BIN;
  if (configuredPath) {
    try {
      await access(configuredPath, fsConstants.X_OK);
      return configuredPath;
    } catch {
      throw new Error(`aliyun-cli runner 不可执行: ${configuredPath}`);
    }
  }

  const globalRunner = await findExecutableOnPath(
    process.platform === 'win32' ? 'aliyun.exe' : 'aliyun',
    env
  );
  if (globalRunner) return globalRunner;
  return (options.ensureRunner || ensureAlicloudRunner)();
}

const defaultSpawnProcess: SpawnProcess = (command, args, options) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, args, { env: options.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer | string) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk: Buffer | string) => { stderr += chunk.toString(); });
  child.on('error', reject);
  child.on('close', (exitCode, signal) => resolvePromise({ exitCode: exitCode ?? 1, signal, stdout, stderr }));
});

function findRequestId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['RequestId', 'requestId', 'requestid']) {
    if (typeof record[key] === 'string') return record[key];
  }
  for (const child of Object.values(record)) {
    const requestId = findRequestId(child);
    if (requestId) return requestId;
  }
  return undefined;
}

function parseRunnerResponse(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const lines = trimmed.split(/\r?\n/).reverse();
    for (const line of lines) {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        // Keep looking for the JSON payload.
      }
    }
    return trimmed;
  }
}

function isSensitiveName(name: string) {
  return /(secret|token|password|credential|authorization|cookie|session[_-]?id|private[_-]?key|access[_-]?key|api[_-]?key)/i.test(name);
}

function redactValue(value: unknown, secrets: string[] = [], sensitiveNames = new Set<string>()): unknown {
  if (Array.isArray(value)) return value.map((child) => redactValue(child, secrets, sensitiveNames));
  if (typeof value === 'string') return redactText(value, secrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [
    key,
    isSensitiveName(key) || sensitiveNames.has(key.toLowerCase())
      ? '[REDACTED]'
      : redactValue(child, secrets, sensitiveNames)
  ]));
}

function sensitiveResponseNames(operationRef: string) {
  return operationRef.toLowerCase() === 'cs.describeclusteruserkubeconfig'
    ? new Set(['config'])
    : new Set<string>();
}

function redactText(value: string, secrets: string[]) {
  return secrets.filter(Boolean).reduce((text, secret) => text.split(secret).join('[REDACTED]'), value);
}

function redactArgs(args: string[], auth: AuthConfig | undefined) {
  const secrets = [auth?.ak || '', auth?.sk || ''];
  return args.map((arg, index) => {
    if (args[index - 1] === '--header') {
      const separator = arg.indexOf('=');
      if (separator > 0 && isSensitiveName(arg.slice(0, separator))) return `${arg.slice(0, separator)}=[REDACTED]`;
    }
    return redactText(arg, secrets);
  });
}

export async function executeAlicloudApi(
  operationRef: string,
  input: Record<string, unknown> = {},
  context: OpenApiRunnerContext = {}
): Promise<OpenApiRunnerResult> {
  const described = describeAlicloudCapability(operationRef);
  const capability = described.capability;
  const sensitiveNames = sensitiveResponseNames(capability.shorthand);
  const region = context.region || context.auth?.region || 'cn-hangzhou';
  const compiled = buildRunnerArgs(capability, input, { ...context, region });
  if (!context.dryRun && sensitiveNames.size > 0 && !context.exposeSensitiveResponse) {
    throw new SensitiveResponseAccessError(capability.shorthand, [...sensitiveNames]);
  }
  const auth = context.auth || (context.dryRun ? undefined : Config.requireAuth());
  const runner = context.dryRun ? (context.runnerPath || '<aliyun-cli-runner>') : await resolveAlicloudRunner(context.runnerPath);
  const args = compiled.args;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(context.env || {}),
    ...(auth ? {
      ALIBABA_CLOUD_ACCESS_KEY_ID: auth.ak,
      ALIBABA_CLOUD_ACCESS_KEY_SECRET: auth.sk
    } : {}),
    ALIBABA_CLOUD_REGION_ID: region
  };
  const plan: OpenApiRunnerPlan = {
    runner,
    args: redactArgs(args, auth),
    envKeys: ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'ALIBABA_CLOUD_REGION_ID'],
    product: capability.product.directory,
    operation: capability.operation,
    apiStyle: capability.apiStyle,
    method: capability.method,
    requestPath: compiled.requestPath,
    endpoint: context.endpoint || capability.product.endpoint.regional[region] || capability.product.endpoint.global || null
  };
  if (context.dryRun) {
    return { ok: true, exitCode: 0, signal: null, stdout: '', stderr: '', response: null, plan, maturity: 'raw' };
  }

  const processResult = await (context.spawnProcess || defaultSpawnProcess)(runner, args, { env });
  const rawResponse = parseRunnerResponse(processResult.stdout);
  const secrets = [auth?.ak || '', auth?.sk || ''];
  const response = context.exposeSensitiveResponse
    ? rawResponse
    : redactValue(rawResponse, secrets, sensitiveNames);
  return {
    ok: processResult.exitCode === 0,
    exitCode: processResult.exitCode,
    signal: processResult.signal,
    stdout: sensitiveNames.size > 0 && processResult.stdout ? '[REDACTED]' : redactText(processResult.stdout, secrets),
    stderr: redactText(processResult.stderr, secrets),
    response,
    ...(findRequestId(response) ? { requestId: findRequestId(response) } : {}),
    plan,
    maturity: 'raw'
  };
}

export function buildAlicloudApiScaffold(operationRef: string) {
  const described = describeAlicloudCapability(operationRef);
  const capability = described.capability;
  const template: Record<string, unknown> = {};
  for (const parameter of capability.parameters) {
    if (parameter.type === 'RepeatList' || parameter.type === 'Array') {
      template[parameter.name] = parameter.subParameters?.length
        ? [{ ...Object.fromEntries(parameter.subParameters.map((child) => [child.name, null])) }]
        : [];
    } else if (parameter.type === 'Json' || parameter.type === 'Struct') {
      template[parameter.name] = {};
    } else {
      template[parameter.name] = null;
    }
  }
  return {
    documentKind: 'licell-alicloud-api-scaffold',
    documentSchemaVersion: '1.0',
    source: described.source,
    capability,
    template,
    invocation: `licell api invoke ${capability.shorthand} --params-file request.json --dry-run --output json`,
    limitations: ['这是 raw API 请求模板，不包含业务幂等性、回滚、状态验证或响应 schema。']
  };
}
