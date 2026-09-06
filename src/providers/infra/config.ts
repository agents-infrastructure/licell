import * as $Rds from '@alicloud/rds20140815';
import { isTransientError } from '../../utils/alicloud-error';
import { Config, type AuthConfig } from '../../utils/config';
import { withRetry } from '../../utils/retry';
import { createRdsClient } from './client';

export interface DatabaseConfigDesiredState {
  description: string;
}

export interface DatabaseConfigAttributes {
  description: string | null;
}

export interface DatabaseConfigChange {
  field: 'description';
  action: 'set' | 'noop';
  before: string | null;
  after: string;
}

export interface DatabaseConfigPlan {
  regionId: string;
  instanceId: string;
  current: DatabaseConfigAttributes;
  desiredState: DatabaseConfigDesiredState;
  after: DatabaseConfigAttributes;
  changes: DatabaseConfigChange[];
  changeCount: number;
  requiresConfirmation: true;
  willExecute: boolean;
}

export interface DatabaseConfigApplyResult {
  plan: DatabaseConfigPlan;
  execution: { performed: boolean; requestId?: string };
  verify: { performed: true; matched: true; attributes: DatabaseConfigAttributes };
}

export interface DatabaseConfigClient {
  describeDBInstanceAttribute(request: $Rds.DescribeDBInstanceAttributeRequest): Promise<{
    body?: {
      items?: {
        DBInstanceAttribute?: Array<{
          DBInstanceId?: string;
          DBInstanceDescription?: string;
          regionId?: string;
        }>;
      };
    };
  }>;
  modifyDBInstanceDescription(request: $Rds.ModifyDBInstanceDescriptionRequest): Promise<{
    body?: { requestId?: string };
  }>;
}

export interface DatabaseConfigDependencies {
  auth?: AuthConfig;
  client?: DatabaseConfigClient;
}

function normalizeDesiredState(input: unknown): DatabaseConfigDesiredState {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('RDS config desired-state 必须是 JSON object');
  }
  const record = input as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => key !== 'description');
  if (unknown.length > 0) {
    throw new Error(`RDS config desired-state 包含未知字段: ${unknown.join(', ')}`);
  }
  if (typeof record.description !== 'string' || !record.description.trim()) {
    throw new Error('description 必须是非空字符串');
  }
  return { description: record.description.trim() };
}

function resolveContext(
  regionOverride: string | undefined,
  dependencies: DatabaseConfigDependencies
) {
  const auth = dependencies.auth || Config.requireAuth();
  const regionId = regionOverride?.trim() || auth.region;
  const client = dependencies.client
    || createRdsClient(regionId).client as unknown as DatabaseConfigClient;
  return { client, regionId };
}

async function readDatabaseConfig(
  instanceId: string,
  regionId: string,
  client: DatabaseConfigClient
): Promise<DatabaseConfigAttributes> {
  const response = await client.describeDBInstanceAttribute(
    new $Rds.DescribeDBInstanceAttributeRequest({ DBInstanceId: instanceId })
  );
  const rows = response.body?.items?.DBInstanceAttribute || [];
  const instance = rows.find((item) => item.DBInstanceId === instanceId) || rows[0];
  if (!instance?.DBInstanceId) {
    throw new Error(`未找到数据库实例: ${instanceId}（region=${regionId}）`);
  }
  return { description: instance.DBInstanceDescription || null };
}

function buildDatabaseConfigPlan(
  regionId: string,
  instanceId: string,
  current: DatabaseConfigAttributes,
  desiredState: DatabaseConfigDesiredState,
  execute: boolean
): DatabaseConfigPlan {
  const after = { description: desiredState.description };
  const action = current.description === after.description ? 'noop' : 'set';
  return {
    regionId,
    instanceId,
    current,
    desiredState,
    after,
    changes: [{
      field: 'description',
      action,
      before: current.description,
      after: after.description
    }],
    changeCount: action === 'set' ? 1 : 0,
    requiresConfirmation: true,
    willExecute: execute && action === 'set'
  };
}

async function verifyDatabaseConfig(
  instanceId: string,
  expected: DatabaseConfigAttributes,
  regionId: string,
  client: DatabaseConfigClient
) {
  return withRetry(async () => {
    const attributes = await readDatabaseConfig(instanceId, regionId, client);
    if (attributes.description !== expected.description) {
      const pending = new Error('RDS config 写入后状态尚未收敛') as Error & { code?: string };
      pending.code = 'DatabaseConfigVerificationPending';
      throw pending;
    }
    return attributes;
  }, {
    maxAttempts: 4,
    baseDelayMs: 300,
    shouldRetry: (err) => (
      (err as { code?: unknown })?.code === 'DatabaseConfigVerificationPending'
      || isTransientError(err)
    )
  });
}

export async function planDatabaseConfig(
  instanceId: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: DatabaseConfigDependencies = {}
): Promise<DatabaseConfigPlan> {
  const id = instanceId.trim();
  if (!id) throw new Error('instanceId 不能为空');
  const desiredState = normalizeDesiredState(desiredInput);
  const { client, regionId } = resolveContext(options.regionId, dependencies);
  const current = await readDatabaseConfig(id, regionId, client);
  return buildDatabaseConfigPlan(regionId, id, current, desiredState, false);
}

export async function applyDatabaseConfig(
  instanceId: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: DatabaseConfigDependencies = {}
): Promise<DatabaseConfigApplyResult> {
  const id = instanceId.trim();
  if (!id) throw new Error('instanceId 不能为空');
  const desiredState = normalizeDesiredState(desiredInput);
  const { client, regionId } = resolveContext(options.regionId, dependencies);
  const current = await readDatabaseConfig(id, regionId, client);
  const plan = buildDatabaseConfigPlan(regionId, id, current, desiredState, true);

  if (!plan.willExecute) {
    return {
      plan,
      execution: { performed: false },
      verify: { performed: true, matched: true, attributes: current }
    };
  }

  const response = await client.modifyDBInstanceDescription(
    new $Rds.ModifyDBInstanceDescriptionRequest({
      DBInstanceId: id,
      DBInstanceDescription: plan.after.description || ''
    })
  );
  try {
    const attributes = await verifyDatabaseConfig(id, plan.after, regionId, client);
    return {
      plan,
      execution: { performed: true, requestId: response.body?.requestId },
      verify: { performed: true, matched: true, attributes }
    };
  } catch (err: unknown) {
    throw new Error(
      `RDS config 写入请求 ${response.body?.requestId || '(unknown)'} 已被接受，但读回验证未完成。` +
      `请勿立即重复调用 ModifyDBInstanceDescription；稍后执行 licell db info ${id} --region ${regionId} --output json 复查。` +
      `原因: ${String((err as Error)?.message || err)}`
    );
  }
}
