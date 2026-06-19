import FC20230330, * as $FC from '@alicloud/fc20230330';
import * as $Util from '@alicloud/tea-util';
import { isNotFoundError, isTransientError } from '../../utils/alicloud-error';
import { formatErrorMessage } from '../../utils/errors';
import { readLicellEnv } from '../../utils/env';
import { withRetry } from '../../utils/retry';
import { sleep } from '../../utils/runtime';
import { getFcTimeoutConfig, parsePositiveIntEnv } from '../../utils/sdk';

const DEFAULT_FC_OPERATION_TIMEOUT_BUFFER_MS = 10_000;
const DEFAULT_FC_QUALIFIER_READY_TIMEOUT_MS = 30_000;
const DEFAULT_FC_MUTATION_READY_TIMEOUT_MS = 180_000;
const DEFAULT_FC_QUALIFIER_READY_INTERVAL_MS = 2_000;
const DEFAULT_FC_RETRY_MAX_ATTEMPTS = 3;
const DEFAULT_FC_MUTATION_RETRY_MAX_ATTEMPTS = 4;
const DEFAULT_FC_RETRY_BASE_DELAY_MS = 1_000;
const DEFAULT_FC_MUTATION_CONNECT_TIMEOUT_MS = 30_000;

function readBooleanEnv(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

function isTraceEnabled(env: Record<string, string | undefined> = process.env) {
  return readBooleanEnv(readLicellEnv(env, 'FC_TRACE'));
}

function trace(operation: string, message: string, env: Record<string, string | undefined> = process.env) {
  if (!isTraceEnabled(env)) return;
  console.error(`[licell][fc] ${new Date().toISOString()} ${operation}: ${message}`);
}

export type FcRetryProfile = 'read' | 'mutation';
export type FcReadableProfile = 'read' | 'mutation';

export interface FcGuardConfig {
  connectTimeoutMs: number;
  readTimeoutMs: number;
  operationTimeoutMs: number;
  qualifierReadyTimeoutMs: number;
  mutationReadyTimeoutMs: number;
  qualifierReadyIntervalMs: number;
  retryMaxAttempts: number;
  retryBaseDelayMs: number;
}

export function getFcGuardConfig(env: Record<string, string | undefined> = process.env): FcGuardConfig {
  const { connectTimeoutMs, readTimeoutMs } = getFcTimeoutConfig(env);
  const qualifierReadyTimeoutMs = parsePositiveIntEnv(
    readLicellEnv(env, 'FC_QUALIFIER_READY_TIMEOUT_MS'),
    DEFAULT_FC_QUALIFIER_READY_TIMEOUT_MS
  );
  return {
    connectTimeoutMs,
    readTimeoutMs,
    operationTimeoutMs: parsePositiveIntEnv(
      readLicellEnv(env, 'FC_OPERATION_TIMEOUT_MS'),
      readTimeoutMs + DEFAULT_FC_OPERATION_TIMEOUT_BUFFER_MS
    ),
    qualifierReadyTimeoutMs,
    mutationReadyTimeoutMs: parsePositiveIntEnv(
      readLicellEnv(env, 'FC_MUTATION_READY_TIMEOUT_MS'),
      Math.max(DEFAULT_FC_MUTATION_READY_TIMEOUT_MS, qualifierReadyTimeoutMs)
    ),
    qualifierReadyIntervalMs: parsePositiveIntEnv(
      readLicellEnv(env, 'FC_QUALIFIER_READY_INTERVAL_MS'),
      DEFAULT_FC_QUALIFIER_READY_INTERVAL_MS
    ),
    retryMaxAttempts: parsePositiveIntEnv(
      readLicellEnv(env, 'FC_RETRY_MAX_ATTEMPTS'),
      DEFAULT_FC_RETRY_MAX_ATTEMPTS
    ),
    retryBaseDelayMs: parsePositiveIntEnv(
      readLicellEnv(env, 'FC_RETRY_BASE_DELAY_MS'),
      DEFAULT_FC_RETRY_BASE_DELAY_MS
    )
  };
}

function resolveRetryMaxAttempts(config: FcGuardConfig, profile: FcRetryProfile) {
  return profile === 'mutation'
    ? Math.max(config.retryMaxAttempts, DEFAULT_FC_MUTATION_RETRY_MAX_ATTEMPTS)
    : config.retryMaxAttempts;
}

function resolveReadableTimeout(config: FcGuardConfig, profile: FcReadableProfile) {
  return profile === 'mutation' ? config.mutationReadyTimeoutMs : config.qualifierReadyTimeoutMs;
}

export function createFcRuntimeOptions(
  env: Record<string, string | undefined> = process.env,
  overrides: Partial<Pick<FcGuardConfig, 'connectTimeoutMs' | 'readTimeoutMs'>> = {}
) {
  const config = getFcGuardConfig(env);
  return new $Util.RuntimeOptions({
    connectTimeout: overrides.connectTimeoutMs ?? config.connectTimeoutMs,
    readTimeout: overrides.readTimeoutMs ?? config.readTimeoutMs
  });
}

export function createFcMutationRuntimeOptions(
  env: Record<string, string | undefined> = process.env,
  overrides: Partial<Pick<FcGuardConfig, 'connectTimeoutMs' | 'readTimeoutMs'>> = {}
) {
  const config = getFcGuardConfig(env);
  return createFcRuntimeOptions(env, {
    connectTimeoutMs: Math.max(overrides.connectTimeoutMs ?? config.connectTimeoutMs, DEFAULT_FC_MUTATION_CONNECT_TIMEOUT_MS),
    readTimeoutMs: overrides.readTimeoutMs ?? config.readTimeoutMs
  });
}

function toRequestModelName(methodName: string) {
  const pascal = methodName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return `${pascal}Request`;
}

function createCompatRequestModel(methodName: string) {
  const modelName = toRequestModelName(methodName);
  const maybeCtor = ($FC as Record<string, unknown>)[modelName];
  if (typeof maybeCtor === 'function') {
    try {
      return new (maybeCtor as new (init?: Record<string, unknown>) => unknown)({});
    } catch {
      // Fall through to the minimal shim below.
    }
  }
  return {
    validate() {}
  };
}

const FC_METHODS_WITH_RESOURCE_NAME_AND_REQUEST = new Set([
  'deleteAsyncInvokeConfig',
  'deleteConcurrencyConfig',
  'deleteCustomDomain',
  'deleteFunction',
  'deleteProvisionConfig',
  'deleteScalingConfig',
  'getAsyncInvokeConfig',
  'getConcurrencyConfig',
  'getCustomDomain',
  'getFunction',
  'getFunctionCode',
  'getLayerVersionByArn',
  'getProvisionConfig',
  'getScalingConfig'
]);

function shouldAppendCompatRequestByMethodName(methodName: string, args: unknown[]) {
  if (!FC_METHODS_WITH_RESOURCE_NAME_AND_REQUEST.has(methodName)) return false;
  if (args.length !== 1) return false;
  return typeof args[0] === 'string';
}

function buildCompatWithOptionsArgs(
  methodName: string,
  method: unknown,
  args: unknown[]
) {
  if (typeof method !== 'function') return args;
  if (shouldAppendCompatRequestByMethodName(methodName, args)) {
    return [...args, createCompatRequestModel(methodName)];
  }
  const expectedArgCount = method.length;
  const providedArgCount = args.length + 2; // headers + runtime
  const missingArgCount = expectedArgCount - providedArgCount;
  if (missingArgCount <= 0) return args;

  return [
    ...args,
    ...Array.from({ length: missingArgCount }, () => createCompatRequestModel(methodName))
  ];
}

export async function callFcWithRuntime<T = any>(
  client: Record<string, unknown>,
  methodName: string,
  args: unknown[],
  options: {
    withOptionsMethodName?: string;
    headers?: unknown;
    runtime?: $Util.RuntimeOptions;
    env?: Record<string, string | undefined>;
  } = {}
): Promise<T> {
  const withOptionsMethodName = options.withOptionsMethodName || `${methodName}WithOptions`;
  const runtime = options.runtime || createFcRuntimeOptions(options.env);
  const withOptionsMethod = client[withOptionsMethodName];
  if (typeof withOptionsMethod === 'function') {
    const compatArgs = buildCompatWithOptionsArgs(methodName, withOptionsMethod, args);
    return await (withOptionsMethod as (this: unknown, ...fnArgs: unknown[]) => Promise<T>).call(
      client,
      ...compatArgs,
      options.headers ?? {},
      runtime
    );
  }
  const plainMethod = client[methodName];
  if (typeof plainMethod !== 'function') {
    throw new Error(`FC client method not found: ${methodName}`);
  }
  return await (plainMethod as (this: unknown, ...fnArgs: unknown[]) => Promise<T>).call(client, ...args);
}

export class FcOperationTimeoutError extends Error {
  operation: string;
  timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super(`FC 操作超时: ${operation} (> ${timeoutMs}ms)`);
    this.name = 'FcOperationTimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

export function isFcOperationTimeoutError(err: unknown): err is FcOperationTimeoutError {
  return err instanceof FcOperationTimeoutError
    || (typeof err === 'object' && err !== null && 'name' in err && String((err as { name?: unknown }).name) === 'FcOperationTimeoutError');
}

export function shouldRetryFcOperation(err: unknown) {
  return isTransientError(err);
}

export async function withFcOperationDeadline<T>(
  operation: string,
  task: () => Promise<T>,
  options: { env?: Record<string, string | undefined>; timeoutMs?: number } = {}
): Promise<T> {
  const env = options.env ?? process.env;
  const config = getFcGuardConfig(env);
  const timeoutMs = options.timeoutMs ?? config.operationTimeoutMs;
  trace(operation, 'start', env);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race<T>([
      task(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new FcOperationTimeoutError(operation, timeoutMs)), timeoutMs);
      })
    ]);
    trace(operation, 'ok', env);
    return result;
  } catch (err: unknown) {
    trace(operation, `failed: ${formatErrorMessage(err)}`, env);
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface FcRetryOptions {
  env?: Record<string, string | undefined>;
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (err: unknown) => boolean;
  profile?: FcRetryProfile;
}

export async function withFcRetry<T>(
  operation: string,
  task: () => Promise<T>,
  options: FcRetryOptions = {}
): Promise<T> {
  const env = options.env ?? process.env;
  const config = getFcGuardConfig(env);
  const profile = options.profile ?? 'read';
  const maxAttempts = options.maxAttempts ?? resolveRetryMaxAttempts(config, profile);
  const baseDelayMs = options.baseDelayMs ?? config.retryBaseDelayMs;
  const shouldRetry = options.shouldRetry ?? shouldRetryFcOperation;

  return await withRetry(task, {
    maxAttempts,
    baseDelayMs,
    shouldRetry,
    onRetry: async (err, context) => {
      trace(
        operation,
        `retry ${context.nextAttempt}/${context.maxAttempts} after ${formatErrorMessage(err)}; sleep=${Math.round(context.delayMs)}ms`,
        env
      );
    }
  });
}

export interface CallFcGuardOptions extends FcRetryOptions {
  withOptionsMethodName?: string;
  headers?: unknown;
  runtime?: $Util.RuntimeOptions;
  timeoutMs?: number;
}

export async function callFcWithGuard<T = any>(
  client: Record<string, unknown>,
  methodName: string,
  argsOrFactory: unknown[] | (() => unknown[]),
  options: CallFcGuardOptions & { operation?: string } = {}
): Promise<T> {
  const env = options.env ?? process.env;
  const profile = options.profile ?? 'read';
  const operation = options.operation || methodName;
  const runtime = options.runtime || (profile === 'mutation' ? createFcMutationRuntimeOptions(env) : createFcRuntimeOptions(env));
  const resolveArgs = () => (typeof argsOrFactory === 'function' ? argsOrFactory() : argsOrFactory);

  return await withFcOperationDeadline(
    operation,
    async () => await withFcRetry(
      operation,
      async () => await callFcWithRuntime<T>(client, methodName, resolveArgs(), {
        withOptionsMethodName: options.withOptionsMethodName,
        headers: options.headers,
        runtime,
        env
      }),
      {
        env,
        profile,
        maxAttempts: options.maxAttempts,
        baseDelayMs: options.baseDelayMs,
        shouldRetry: options.shouldRetry
      }
    ),
    { env, timeoutMs: options.timeoutMs }
  );
}

function shouldRetryQualifierRead(err: unknown) {
  return isNotFoundError(err) || isTransientError(err) || isFcOperationTimeoutError(err);
}

function resolveFcReadableTimeoutMs(
  config: FcGuardConfig,
  profile: FcRetryProfile,
  explicitTimeoutMs?: number
) {
  if (explicitTimeoutMs !== undefined) return explicitTimeoutMs;
  return profile === 'mutation' ? config.mutationReadyTimeoutMs : config.qualifierReadyTimeoutMs;
}

export async function waitForFcFunctionReadable(
  functionName: string,
  client: FC20230330,
  options: {
    qualifier?: string;
    env?: Record<string, string | undefined>;
    profile?: FcReadableProfile;
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
): Promise<$FC.Function> {
  const env = options.env ?? process.env;
  const config = getFcGuardConfig(env);
  const profile = options.profile ?? 'read';
  const timeoutMs = options.timeoutMs ?? resolveReadableTimeout(config, profile);
  const intervalMs = options.intervalMs ?? config.qualifierReadyIntervalMs;
  const qualifier = options.qualifier?.trim() || undefined;
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const remainingMs = Math.max(timeoutMs - (Date.now() - startedAt), 1);
      const operation = `getFunction(${functionName}${qualifier ? `@${qualifier}` : ''})`;
      const response = await callFcWithGuard<$FC.GetFunctionResponse>(
        client as unknown as Record<string, unknown>,
        'getFunction',
        [functionName, new $FC.GetFunctionRequest({ qualifier })],
        {
          operation,
          env,
          profile: 'read',
          timeoutMs: remainingMs
        }
      );
      const fn = response.body;
      if (fn?.functionName) {
        trace(operation, 'ready', env);
        return fn;
      }
      lastError = new Error(`函数 ${functionName} 未返回有效详情`);
    } catch (err: unknown) {
      lastError = err;
      if (!shouldRetryQualifierRead(err)) throw err;
    }
    await sleep(intervalMs);
  }

  throw new Error(
    `等待函数就绪超时: ${functionName}${qualifier ? `@${qualifier}` : ''} (${timeoutMs}ms)${lastError ? `; lastError=${formatErrorMessage(lastError)}` : ''}`
  );
}
