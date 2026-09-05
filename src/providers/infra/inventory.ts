import Rds, * as $Rds from '@alicloud/rds20140815';
import { createRdsClient } from './client';

export interface DatabaseInventoryOptions {
  regionId?: string;
  limit?: number;
  prefix?: string;
}

export interface DatabaseBackupOptions extends DatabaseInventoryOptions {
  days?: number;
  status?: string;
}

function requiredId(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error('instanceId 不能为空');
  return normalized;
}

function safeLimit(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 50), 200));
}

function rdsMinuteTimestamp(value: Date) {
  return `${value.toISOString().slice(0, 16)}Z`;
}

function resolveClient(regionId: string | undefined, injected?: Rds) {
  if (injected) return { client: injected, regionId: regionId?.trim() || 'injected' };
  return createRdsClient(regionId);
}

export async function listDatabaseBackups(
  instanceId: string,
  options: DatabaseBackupOptions = {},
  injected?: Rds
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const days = Math.max(1, Math.min(Math.floor(options.days || 7), 365));
  const { client, regionId } = resolveClient(options.regionId, injected);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const backups: Array<{
    backupId?: string;
    instanceId?: string;
    status?: string;
    type?: string;
    mode?: string;
    method?: string;
    sizeBytes?: number;
    startTime?: string;
    endTime?: string;
    initiator?: string;
    encryption?: string;
    storageClass?: string;
  }> = [];
  let totalCount: number | undefined;
  let locallyTruncated = false;

  for (let pageNumber = 1; pageNumber <= 20 && backups.length < limit; pageNumber += 1) {
    const remaining = limit - backups.length;
    const pageSize = 100;
    const response = await client.describeBackups(new $Rds.DescribeBackupsRequest({
      DBInstanceId: id,
      startTime: rdsMinuteTimestamp(start),
      endTime: rdsMinuteTimestamp(end),
      backupStatus: options.status?.trim() || undefined,
      pageNumber,
      pageSize
    }));
    const rows = response.body?.items?.backup || [];
    const parsedTotal = Number(response.body?.totalRecordCount);
    if (Number.isFinite(parsedTotal)) totalCount = parsedTotal;
    if (rows.length > remaining) locallyTruncated = true;
    backups.push(...rows.slice(0, remaining).map((item) => ({
      backupId: item.backupId,
      instanceId: item.DBInstanceId || id,
      status: item.backupStatus,
      type: item.backupType,
      mode: item.backupMode,
      method: item.backupMethod,
      sizeBytes: item.backupSize,
      startTime: item.backupStartTime,
      endTime: item.backupEndTime,
      initiator: item.backupInitiator,
      encryption: item.encryption,
      storageClass: item.storageClass
    })));
    if (rows.length < pageSize || (totalCount !== undefined && pageNumber * pageSize >= totalCount)) break;
  }

  const policyResponse = await client.describeBackupPolicy(new $Rds.DescribeBackupPolicyRequest({ DBInstanceId: id }));
  const policy = policyResponse.body;
  return {
    instanceId: id,
    regionId,
    days,
    limit,
    totalCount,
    truncated: locallyTruncated || (totalCount !== undefined ? backups.length < totalCount : backups.length >= limit),
    policy: {
      backupMethod: policy?.backupMethod,
      backupRetentionDays: policy?.backupRetentionPeriod,
      preferredPeriod: policy?.preferredBackupPeriod,
      preferredTime: policy?.preferredBackupTime,
      preferredNextTime: policy?.preferredNextBackupTime,
      logBackupEnabled: policy?.enableBackupLog || policy?.backupLog,
      logBackupRetentionDays: policy?.logBackupRetentionPeriod,
      pitrEnabled: policy?.enablePitrProtection,
      pitrRetentionDays: policy?.pitrRetentionPeriod,
      releasedKeepPolicy: policy?.releasedKeepPolicy
    },
    backups
  };
}

export async function listDatabaseParameters(
  instanceId: string,
  options: DatabaseInventoryOptions = {},
  injected?: Rds
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const response = await client.describeParameters(new $Rds.DescribeParametersRequest({ DBInstanceId: id }));
  const body = response.body;
  const prefix = options.prefix?.trim().toLowerCase() || '';
  const matchesPrefix = (name: string | undefined) => !prefix || (name || '').toLowerCase().startsWith(prefix);
  const running = (body?.runningParameters?.DBInstanceParameter || []).filter((item) => matchesPrefix(item.parameterName));
  const configured = (body?.configParameters?.DBInstanceParameter || []).filter((item) => matchesPrefix(item.parameterName));
  const group = body?.paramGroupInfo;
  const parameterGroup = group && [group.paramGroupId, group.parameterGroupName, group.parameterGroupType, group.parameterGroupDesc].some(Boolean)
    ? { id: group.paramGroupId, name: group.parameterGroupName, type: group.parameterGroupType, description: group.parameterGroupDesc }
    : null;
  return {
    instanceId: id,
    regionId,
    engine: body?.engine,
    engineVersion: body?.engineVersion,
    parameterGroup,
    limit,
    truncated: running.length > limit || configured.length > limit,
    running: running.slice(0, limit).map((item) => ({ name: item.parameterName, value: item.parameterValue, description: item.parameterDescription })),
    configured: configured.slice(0, limit).map((item) => ({ name: item.parameterName, value: item.parameterValue, description: item.parameterDescription }))
  };
}

export async function listDatabaseAccounts(
  instanceId: string,
  options: DatabaseInventoryOptions & { name?: string } = {},
  injected?: Rds
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const accounts: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNumber = 1; pageNumber <= 20 && accounts.length < limit; pageNumber += 1) {
    const response = await client.describeAccounts(new $Rds.DescribeAccountsRequest({
      DBInstanceId: id,
      accountName: options.name?.trim() || undefined,
      pageNumber,
      pageSize: Math.min(200, Math.max(30, limit - accounts.length))
    }));
    const rows = response.body?.accounts?.DBInstanceAccount || [];
    totalCount = response.body?.totalRecordCount;
    accounts.push(...rows.slice(0, limit - accounts.length).map((item) => ({
      name: item.accountName,
      status: item.accountStatus,
      type: item.accountType,
      description: item.accountDescription,
      validUntil: item.validUntil,
      canCreateDb: item.createDB,
      canCreateRole: item.createRole,
      canReplicate: item.replication,
      bypassRls: item.bypassRLS,
      privileges: (item.databasePrivileges?.databasePrivilege || []).map((privilege) => ({
        database: privilege.DBName,
        privilege: privilege.accountPrivilege,
        detail: privilege.accountPrivilegeDetail
      }))
    })));
    if (rows.length === 0 || (totalCount !== undefined && accounts.length >= totalCount)) break;
  }

  return { instanceId: id, regionId, limit, totalCount, truncated: totalCount !== undefined ? accounts.length < totalCount : accounts.length >= limit, accounts };
}

export async function listDatabases(
  instanceId: string,
  options: DatabaseInventoryOptions & { name?: string; status?: string } = {},
  injected?: Rds
) {
  const id = requiredId(instanceId);
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const databases: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNumber = 1; pageNumber <= 20 && databases.length < limit; pageNumber += 1) {
    const pageSize = Math.min(100, Math.max(30, limit - databases.length));
    const response = await client.describeDatabases(new $Rds.DescribeDatabasesRequest({
      DBInstanceId: id,
      DBName: options.name?.trim() || undefined,
      DBStatus: options.status?.trim() || undefined,
      pageNumber,
      pageSize
    }));
    const rows = response.body?.databases?.database || [];
    const itemTotal = rows.map((item) => item.totalCount).find((value) => typeof value === 'number');
    if (itemTotal !== undefined) totalCount = itemTotal;
    databases.push(...rows.slice(0, limit - databases.length).map((item) => ({
      name: item.DBName,
      status: item.DBStatus,
      description: item.DBDescription,
      engine: item.engine,
      characterSet: item.characterSetName,
      collation: item.collate,
      ctype: item.ctype,
      connectionLimit: item.connLimit,
      tablespace: item.tablespace,
      accounts: (item.accounts?.accountPrivilegeInfo || []).map((account) => ({
        name: account.account,
        privilege: account.accountPrivilege,
        detail: account.accountPrivilegeDetail
      }))
    })));
    if (rows.length === 0 || rows.length < pageSize || (totalCount !== undefined && databases.length >= totalCount)) break;
  }

  return { instanceId: id, regionId, limit, totalCount, truncated: totalCount !== undefined ? databases.length < totalCount : databases.length >= limit, databases };
}
