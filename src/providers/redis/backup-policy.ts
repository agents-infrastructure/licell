import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { isTransientError } from '../../utils/alicloud-error';
import { Config, type AuthConfig } from '../../utils/config';
import { withRetry } from '../../utils/retry';
import { createRedisClient } from './client';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export interface CacheBackupPolicyDesiredState {
  preferredPeriod?: string;
  preferredTime?: string;
  retentionDays?: number;
  incrementalBackupEnabled?: boolean;
}

export interface CacheBackupPolicyState {
  preferredPeriod: string;
  preferredTime: string;
  retentionDays: number;
  incrementalBackupEnabled: boolean;
}

export interface CacheBackupPolicyChange {
  field: keyof CacheBackupPolicyState;
  action: 'set' | 'noop';
  before: string | number | boolean;
  after: string | number | boolean;
}

export interface CacheBackupPolicyPlan {
  regionId: string;
  instanceId: string;
  current: CacheBackupPolicyState;
  desiredState: CacheBackupPolicyDesiredState;
  after: CacheBackupPolicyState;
  changes: CacheBackupPolicyChange[];
  changeCount: number;
  requiresConfirmation: true;
  willExecute: boolean;
}

export interface CacheBackupPolicyApplyResult {
  plan: CacheBackupPolicyPlan;
  execution: { performed: boolean; requestId?: string };
  verify: { performed: true; matched: true; policy: CacheBackupPolicyState };
}

export interface CacheBackupPolicyClient {
  describeBackupPolicy(request: $Kvstore.DescribeBackupPolicyRequest): Promise<{
    body: Pick<
      $Kvstore.DescribeBackupPolicyResponseBody,
      'backupRetentionPeriod' | 'preferredBackupPeriod' | 'preferredBackupTime' | 'enableBackupLog'
    >;
  }>;
  modifyBackupPolicy(request: $Kvstore.ModifyBackupPolicyRequest): Promise<{
    body: Pick<$Kvstore.ModifyBackupPolicyResponseBody, 'requestId'>;
  }>;
}

export interface CacheBackupPolicyDependencies {
  auth?: AuthConfig;
  client?: CacheBackupPolicyClient;
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Redis/Tair backup policy desired-state 必须是 JSON object');
  }
  return value as Record<string, unknown>;
}

function normalizePreferredPeriod(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  if (values.length === 0) {
    throw new Error('preferredPeriod 必须是非空星期数组或逗号分隔字符串');
  }
  const requested = new Set<string>();
  for (const item of values) {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error('preferredPeriod 中的星期必须是非空字符串');
    }
    const normalized = WEEKDAYS.find((weekday) => weekday.toLowerCase() === item.trim().toLowerCase());
    if (!normalized) {
      throw new Error(`preferredPeriod 包含无效星期 ${item}；仅支持 ${WEEKDAYS.join(', ')}`);
    }
    requested.add(normalized);
  }
  return WEEKDAYS.filter((weekday) => requested.has(weekday)).join(',');
}

function normalizePreferredTime(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('preferredTime 必须是 UTC 整点一小时时段，例如 02:00Z-03:00Z');
  }
  const normalized = value.trim();
  const match = /^([01]\d|2[0-3]):00Z-([01]\d|2[0-3]|24):00Z$/.exec(normalized);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new Error('preferredTime 必须是 UTC 整点一小时时段，例如 02:00Z-03:00Z');
  }
  return normalized;
}

function normalizeRetentionDays(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 7 || value > 730) {
    throw new Error('retentionDays 必须是 7 到 730 之间的整数');
  }
  return value;
}

export function normalizeCacheBackupPolicyDesiredState(input: unknown): CacheBackupPolicyDesiredState {
  const record = requireRecord(input);
  const allowed = ['preferredPeriod', 'preferredTime', 'retentionDays', 'incrementalBackupEnabled'] as const;
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key as typeof allowed[number]));
  if (unknown.length > 0) {
    throw new Error(`Redis/Tair backup policy desired-state 包含未知字段: ${unknown.join(', ')}`);
  }
  if (!allowed.some((key) => Object.prototype.hasOwnProperty.call(record, key))) {
    throw new Error('Redis/Tair backup policy desired-state 至少需要一个可管理字段');
  }

  const desired: CacheBackupPolicyDesiredState = {};
  if (Object.prototype.hasOwnProperty.call(record, 'preferredPeriod')) {
    desired.preferredPeriod = normalizePreferredPeriod(record.preferredPeriod);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'preferredTime')) {
    desired.preferredTime = normalizePreferredTime(record.preferredTime);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'retentionDays')) {
    desired.retentionDays = normalizeRetentionDays(record.retentionDays);
  }
  if (Object.prototype.hasOwnProperty.call(record, 'incrementalBackupEnabled')) {
    if (typeof record.incrementalBackupEnabled !== 'boolean') {
      throw new Error('incrementalBackupEnabled 必须是 boolean');
    }
    desired.incrementalBackupEnabled = record.incrementalBackupEnabled;
  }
  return desired;
}

function normalizeCurrentPolicy(body: Awaited<ReturnType<CacheBackupPolicyClient['describeBackupPolicy']>>['body']): CacheBackupPolicyState {
  return {
    preferredPeriod: normalizePreferredPeriod(body.preferredBackupPeriod),
    preferredTime: normalizePreferredTime(body.preferredBackupTime),
    retentionDays: normalizeRetentionDays(Number(body.backupRetentionPeriod)),
    incrementalBackupEnabled: body.enableBackupLog === 1
  };
}

function requiredInstanceId(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error('instanceId 不能为空');
  return normalized;
}

function resolveContext(
  options: { regionId?: string },
  dependencies: CacheBackupPolicyDependencies
) {
  const baseAuth = dependencies.auth || Config.requireAuth();
  const regionId = options.regionId?.trim() || baseAuth.region;
  const auth = regionId === baseAuth.region ? baseAuth : { ...baseAuth, region: regionId };
  const client = dependencies.client || createRedisClient(auth) as CacheBackupPolicyClient;
  return { client, regionId };
}

async function readPolicy(instanceId: string, client: CacheBackupPolicyClient) {
  const response = await client.describeBackupPolicy(
    new $Kvstore.DescribeBackupPolicyRequest({ instanceId })
  );
  return normalizeCurrentPolicy(response.body);
}

function buildPlan(
  regionId: string,
  instanceId: string,
  current: CacheBackupPolicyState,
  desiredState: CacheBackupPolicyDesiredState,
  execute: boolean
): CacheBackupPolicyPlan {
  const after = { ...current, ...desiredState };
  const changes: CacheBackupPolicyChange[] = [];
  for (const field of ['preferredPeriod', 'preferredTime', 'retentionDays', 'incrementalBackupEnabled'] as const) {
    if (!Object.prototype.hasOwnProperty.call(desiredState, field)) continue;
    changes.push({
      field,
      action: current[field] === after[field] ? 'noop' : 'set',
      before: current[field],
      after: after[field]
    });
  }
  const changeCount = changes.filter((change) => change.action !== 'noop').length;
  return {
    regionId,
    instanceId,
    current,
    desiredState,
    after,
    changes,
    changeCount,
    requiresConfirmation: true,
    willExecute: execute && changeCount > 0
  };
}

function mutationRequest(plan: CacheBackupPolicyPlan) {
  return new $Kvstore.ModifyBackupPolicyRequest({
    instanceId: plan.instanceId,
    preferredBackupPeriod: plan.after.preferredPeriod,
    preferredBackupTime: plan.after.preferredTime,
    backupRetentionPeriod: Object.prototype.hasOwnProperty.call(plan.desiredState, 'retentionDays')
      ? plan.after.retentionDays
      : undefined,
    enableBackupLog: Object.prototype.hasOwnProperty.call(plan.desiredState, 'incrementalBackupEnabled')
      ? (plan.after.incrementalBackupEnabled ? 1 : 0)
      : undefined
  });
}

function policiesMatch(actual: CacheBackupPolicyState, expected: CacheBackupPolicyState) {
  return actual.preferredPeriod === expected.preferredPeriod
    && actual.preferredTime === expected.preferredTime
    && actual.retentionDays === expected.retentionDays
    && actual.incrementalBackupEnabled === expected.incrementalBackupEnabled;
}

export async function planCacheBackupPolicy(
  instanceId: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: CacheBackupPolicyDependencies = {}
) {
  const id = requiredInstanceId(instanceId);
  const desiredState = normalizeCacheBackupPolicyDesiredState(desiredInput);
  const context = resolveContext(options, dependencies);
  const current = await readPolicy(id, context.client);
  return buildPlan(context.regionId, id, current, desiredState, false);
}

async function verifyPolicy(
  instanceId: string,
  expected: CacheBackupPolicyState,
  client: CacheBackupPolicyClient
) {
  return withRetry(async () => {
    const actual = await readPolicy(instanceId, client);
    if (!policiesMatch(actual, expected)) {
      const pending = new Error('Redis/Tair 备份策略写入后状态尚未收敛') as Error & { code?: string };
      pending.code = 'CacheBackupPolicyVerificationPending';
      throw pending;
    }
    return actual;
  }, {
    maxAttempts: 4,
    baseDelayMs: 300,
    shouldRetry: (err) => (
      (err as { code?: unknown })?.code === 'CacheBackupPolicyVerificationPending' || isTransientError(err)
    )
  });
}

export async function applyCacheBackupPolicy(
  instanceId: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: CacheBackupPolicyDependencies = {}
): Promise<CacheBackupPolicyApplyResult> {
  const id = requiredInstanceId(instanceId);
  const desiredState = normalizeCacheBackupPolicyDesiredState(desiredInput);
  const context = resolveContext(options, dependencies);
  const current = await readPolicy(id, context.client);
  const plan = buildPlan(context.regionId, id, current, desiredState, true);

  if (plan.changeCount === 0) {
    return {
      plan,
      execution: { performed: false },
      verify: { performed: true, matched: true, policy: current }
    };
  }

  const response = await context.client.modifyBackupPolicy(mutationRequest(plan));
  try {
    const policy = await verifyPolicy(id, plan.after, context.client);
    return {
      plan,
      execution: { performed: true, requestId: response.body.requestId },
      verify: { performed: true, matched: true, policy }
    };
  } catch (err: unknown) {
    throw new Error(
      `Redis/Tair 备份策略写入请求 ${response.body.requestId || '(unknown)'} 已被接受，但读回验证未完成。` +
      `请勿立即重复写入；稍后执行 licell cache backups ${id} --output json 复查。` +
      `原因: ${String((err as Error)?.message || err)}`
    );
  }
}
