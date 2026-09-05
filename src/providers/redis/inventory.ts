import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { Config } from '../../utils/config';
import { createRedisClient } from './client';

export interface CacheInventoryOptions {
  regionId?: string;
  limit?: number;
  prefix?: string;
}

export interface CacheBackupOptions extends CacheInventoryOptions {
  days?: number;
}

function requiredId(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error('instanceId 不能为空');
  return normalized;
}

function safeLimit(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 50), 300));
}

function minuteTimestamp(value: Date) {
  return `${value.toISOString().slice(0, 16)}Z`;
}

function resolveClient(regionId: string | undefined, injected?: Kvstore) {
  if (injected) return { client: injected, regionId: regionId?.trim() || 'injected' };
  const auth = Config.requireAuth();
  return { client: createRedisClient(auth), regionId: auth.region };
}

export async function listCacheBackups(
  instanceId: string,
  options: CacheBackupOptions = {},
  injected?: Kvstore
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const days = Math.max(1, Math.min(Math.floor(options.days || 7), 365));
  const { client, regionId } = resolveClient(options.regionId, injected);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const backups: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNumber = 1; pageNumber <= 20 && backups.length < limit; pageNumber += 1) {
    const response = await client.describeBackups(new $Kvstore.DescribeBackupsRequest({
      instanceId: id,
      startTime: minuteTimestamp(start),
      endTime: minuteTimestamp(end),
      pageNumber,
      pageSize: 100
    }));
    const rows = response.body?.backups?.backup || [];
    totalCount = response.body?.totalCount;
    backups.push(...rows.slice(0, limit - backups.length).map((item) => ({
      backupId: item.backupId,
      jobId: item.backupJobID,
      status: item.backupStatus,
      type: item.backupType,
      mode: item.backupMode,
      method: item.backupMethod,
      sizeBytes: item.backupSize,
      startTime: item.backupStartTime,
      endTime: item.backupEndTime,
      expiresAt: item.expectExpireTime,
      engineVersion: item.engineVersion,
      nodeId: item.nodeInstanceId
    })));
    if (rows.length < 100 || (totalCount !== undefined && pageNumber * 100 >= totalCount)) break;
  }

  const policyResponse = await client.describeBackupPolicy(
    new $Kvstore.DescribeBackupPolicyRequest({ instanceId: id })
  );
  const policy = policyResponse.body;
  return {
    instanceId: id,
    regionId,
    days,
    limit,
    totalCount,
    truncated: totalCount !== undefined ? backups.length < totalCount : backups.length >= limit,
    policy: {
      retentionDays: policy?.backupRetentionPeriod,
      preferredPeriod: policy?.preferredBackupPeriod,
      preferredTime: policy?.preferredBackupTime,
      preferredNextTime: policy?.preferredNextBackupTime,
      incrementalBackupEnabled: policy?.enableBackupLog === 1,
      backupServiceEnabled: policy?.dbsInstance === '1'
    },
    backups
  };
}

function normalizeParameterFlag(value: boolean | string | undefined) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  return value.toLowerCase() === 'true';
}

function parseCloudNativeConfig(value: string | undefined) {
  if (!value) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('DescribeInstanceConfig 返回了无法解析的 Config JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  return Object.entries(parsed as Record<string, unknown>).map(([name, parameterValue]) => ({
    name,
    value: typeof parameterValue === 'string' ? parameterValue : JSON.stringify(parameterValue)
  }));
}

export async function listCacheParameters(
  instanceId: string,
  options: CacheInventoryOptions & { nodeId?: string } = {},
  injected?: Kvstore
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const prefix = options.prefix?.trim().toLowerCase() || '';
  const { client, regionId } = resolveClient(options.regionId, injected);
  const matches = (name: string | undefined) => !prefix || (name || '').toLowerCase().startsWith(prefix);

  try {
    const response = await client.describeParameters(new $Kvstore.DescribeParametersRequest({
      DBInstanceId: id,
      regionId,
      nodeId: options.nodeId?.trim() || undefined
    }));
    const body = response.body;
    const running = (body?.runningParameters?.parameter || []).filter((item) => matches(item.parameterName));
    const configured = (body?.configParameters?.parameter || []).filter((item) => matches(item.parameterName));
    return {
      instanceId: id,
      regionId,
      source: 'DescribeParameters' as const,
      engine: body?.engine,
      engineVersion: body?.engineVersion,
      limit,
      truncated: running.length > limit || configured.length > limit,
      running: running.slice(0, limit).map((item) => ({
        name: item.parameterName,
        value: item.parameterValue,
        description: item.parameterDescription,
        validValues: item.checkingCode,
        restartRequired: normalizeParameterFlag(item.forceRestart),
        modifiable: normalizeParameterFlag(item.modifiableStatus)
      })),
      configured: configured.slice(0, limit).map((item) => ({
        name: item.parameterName,
        value: item.parameterValue,
        description: item.parameterDescription,
        validValues: item.checkingCode,
        restartRequired: normalizeParameterFlag(item.forceRestart),
        modifiable: normalizeParameterFlag(item.modifiableStatus)
      }))
    };
  } catch (classicError) {
    try {
      const response = await client.describeInstanceConfig(
        new $Kvstore.DescribeInstanceConfigRequest({ instanceId: id })
      );
      const parameters = parseCloudNativeConfig(response.body?.config).filter((item) => matches(item.name));
      return {
        instanceId: id,
        regionId,
        source: 'DescribeInstanceConfig' as const,
        engine: 'redis',
        engineVersion: undefined,
        limit,
        truncated: parameters.length > limit,
        running: parameters.slice(0, limit),
        configured: []
      };
    } catch {
      throw classicError;
    }
  }
}

export async function listCacheAccounts(
  instanceId: string,
  options: CacheInventoryOptions & { name?: string } = {},
  injected?: Kvstore
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const name = options.name?.trim().toLowerCase() || '';
  const { client, regionId } = resolveClient(options.regionId, injected);
  const response = await client.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId: id }));
  const rows = (response.body?.accounts?.account || []).filter((item) => !name || item.accountName?.toLowerCase() === name);
  return {
    instanceId: id,
    regionId,
    limit,
    totalCount: rows.length,
    truncated: rows.length > limit,
    accounts: rows.slice(0, limit).map((item) => ({
      name: item.accountName,
      status: item.accountStatus,
      type: item.accountType,
      description: item.accountDescription,
      privileges: (item.databasePrivileges?.databasePrivilege || []).map((privilege) => privilege.accountPrivilege)
    }))
  };
}

export async function listCacheTopology(
  instanceId: string,
  options: CacheInventoryOptions = {},
  injected?: Kvstore
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const members: Array<Record<string, unknown>> = [];

  for (let pageNumber = 1; pageNumber <= 20 && members.length < limit; pageNumber += 1) {
    const response = await client.describeClusterMemberInfo(new $Kvstore.DescribeClusterMemberInfoRequest({
      instanceId: id,
      pageNumber,
      pageSize: 100
    }));
    const rows = response.body?.clusterChildren || [];
    members.push(...rows.slice(0, limit - members.length).map((item) => ({
      name: item.name,
      service: item.service,
      version: item.serviceVersion,
      classCode: item.classCode,
      capacityMb: item.capacity,
      maxConnections: item.connections,
      maxBandwidthMbPerSecond: item.bandWidth,
      currentBandwidthMbitPerSecond: item.currentBandWidth,
      replicas: item.replicaSize,
      binlogRetentionDays: item.binlogRetentionDays,
      diskSizeMb: item.diskSizeMB
    })));
    if (rows.length < 100) break;
  }

  return {
    instanceId: id,
    regionId,
    limit,
    count: members.length,
    truncated: members.length >= limit,
    members
  };
}
