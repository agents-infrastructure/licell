import * as $Rds from '@alicloud/rds20140815';
import { Config } from '../../utils/config';
import { isNotFoundError, isTransientError } from '../../utils/alicloud-error';
import { sleep } from '../../utils/runtime';
import { createRdsClient } from './client';
import { resolveDatabaseProvisionDefaults } from './defaults';
import { resolveDatabaseAvailableZoneIds } from './zones';
import { inferDbProtocol, parseDatabaseUrl, readProjectDatabase } from './project-db';
import type {
  DatabaseClassCatalog,
  DatabaseClassEntry,
  DatabaseZoneClassEntry,
  DatabaseConnectInfo,
  DatabaseInstanceDetail,
  DatabaseInstanceSummary
} from './types';

interface ListDatabaseClassesOptions {
  engineVersion?: string;
  category?: string;
  storageType?: string;
  zoneId?: string;
  allZones?: boolean;
}

async function describeAvailableClassesWithRetry(
  client: ReturnType<typeof createRdsClient>['client'],
  request: $Rds.DescribeAvailableClassesRequest
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await client.describeAvailableClasses(request);
    } catch (err: unknown) {
      lastError = err;
      if (!isTransientError(err) || attempt === 5) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('DescribeAvailableClasses 失败');
}

function toDatabaseSummary(item: {
  DBInstanceId?: string;
  DBInstanceDescription?: string;
  engine?: string;
  engineVersion?: string;
  DBInstanceStatus?: string;
  payType?: string;
  category?: string;
  DBInstanceClass?: string;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
}): DatabaseInstanceSummary {
  return {
    instanceId: item.DBInstanceId || '',
    description: item.DBInstanceDescription,
    engine: item.engine,
    engineVersion: item.engineVersion,
    status: item.DBInstanceStatus,
    payType: item.payType,
    category: item.category,
    instanceClass: item.DBInstanceClass,
    zoneId: item.zoneId,
    vpcId: item.vpcId,
    vSwitchId: item.vSwitchId
  };
}

async function getDatabaseInstanceSummaryOrThrow(instanceId: string) {
  const { auth, client } = createRdsClient();
  const res = await client.describeDBInstances(new $Rds.DescribeDBInstancesRequest({
    regionId: auth.region,
    DBInstanceId: instanceId,
    pageNumber: 1,
    pageSize: 30
  }));
  const rows = res.body?.items?.DBInstance || [];
  const matched = rows.find((item) => item.DBInstanceId === instanceId) || rows[0];
  if (!matched?.DBInstanceId) throw new Error(`未找到数据库实例: ${instanceId}`);
  return toDatabaseSummary(matched);
}

export async function listDatabaseInstances(limit = 200): Promise<DatabaseInstanceSummary[]> {
  const { auth, client } = createRdsClient();
  const results: DatabaseInstanceSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const pageSize = Math.min(100, safeLimit);

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const res = await client.describeDBInstances(new $Rds.DescribeDBInstancesRequest({
      regionId: auth.region,
      pageNumber,
      pageSize
    }));
    const rows = res.body?.items?.DBInstance || [];
    for (const row of rows) {
      const summary = toDatabaseSummary(row);
      if (!summary.instanceId) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    const bodyAsRecord = (res.body || {}) as Record<string, unknown>;
    const total = Number(bodyAsRecord.totalRecordCount || bodyAsRecord.totalCount || 0);
    if (rows.length === 0 || (Number.isFinite(total) && total > 0 && results.length >= total)) break;
  }

  return results;
}

export async function getDatabaseInstanceDetail(instanceId: string): Promise<DatabaseInstanceDetail> {
  const resolvedId = instanceId.trim();
  if (!resolvedId) throw new Error('instanceId 不能为空');
  const { client } = createRdsClient();
  const summary = await getDatabaseInstanceSummaryOrThrow(resolvedId);

  const netRes = await client.describeDBInstanceNetInfo(new $Rds.DescribeDBInstanceNetInfoRequest({
    DBInstanceId: resolvedId
  }));
  const endpoints = (netRes.body?.DBInstanceNetInfos?.DBInstanceNetInfo || []).map((item) => ({
    type: item.connectionStringType,
    ipType: item.IPType,
    host: item.connectionString,
    port: item.port,
    vpcId: item.VPCId,
    vSwitchId: item.vSwitchId
  }));

  const databasesRes = await client.describeDatabases(new $Rds.DescribeDatabasesRequest({
    DBInstanceId: resolvedId,
    pageNumber: 1,
    pageSize: 100
  }));
  const databases = (databasesRes.body?.databases?.database || [])
    .map((item) => item.DBName)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  const accountsRes = await client.describeAccounts(new $Rds.DescribeAccountsRequest({
    DBInstanceId: resolvedId
  }));
  const accounts = (accountsRes.body?.accounts?.DBInstanceAccount || [])
    .map((item) => item.accountName)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  return {
    summary,
    endpoints,
    databases,
    accounts
  };
}

function sortDatabaseClassEntries(entries: DatabaseClassEntry[]) {
  return [...entries].sort((a, b) => a.instanceClass.localeCompare(b.instanceClass));
}

function upsertDatabaseClassEntry(
  entries: Map<string, DatabaseClassEntry>,
  input: {
    instanceClass?: string;
    zoneId: string;
    storageRange?: DatabaseClassEntry['storageRange'];
  }
) {
  const instanceClass = input.instanceClass?.trim() || '';
  if (!instanceClass) return;
  const current = entries.get(instanceClass);
  const zoneIds = new Set([...(current?.zoneIds || []), input.zoneId]);
  entries.set(instanceClass, {
    instanceClass,
    storageRange: current?.storageRange || input.storageRange,
    zoneIds: [...zoneIds].sort()
  });
}

function sortZoneClassEntries(entries: DatabaseZoneClassEntry[]) {
  return [...entries].sort((a, b) => a.zoneId.localeCompare(b.zoneId));
}

export async function listDatabaseClasses(
  dbType: 'postgres' | 'mysql',
  options: ListDatabaseClassesOptions = {}
): Promise<DatabaseClassCatalog> {
  const { auth, client } = createRdsClient();
  const defaults = resolveDatabaseProvisionDefaults(dbType, options);
  const explicitZoneId = options.zoneId?.trim() || '';
  const allZones = Boolean(options.allZones && !explicitZoneId);
  const resolvedZoneIds = explicitZoneId
    ? [explicitZoneId]
    : await resolveDatabaseAvailableZoneIds(client, auth.region, dbType, {
        engine: defaults.engine,
        engineVersion: defaults.engineVersion,
        category: defaults.category
      });
  const zoneIds = explicitZoneId
    ? resolvedZoneIds
    : (allZones ? resolvedZoneIds : resolvedZoneIds.slice(0, 1));
  if (zoneIds.length === 0) {
    throw new Error(`未查询到 ${defaults.engine} 可用区，请尝试显式传入 --zone`);
  }

  const entries = new Map<string, DatabaseClassEntry>();
  const zoneEntries = new Map<string, Set<string>>();
  for (const zoneId of zoneIds) {
    let response: Awaited<ReturnType<typeof client.describeAvailableClasses>>;
    try {
      response = await describeAvailableClassesWithRetry(client, new $Rds.DescribeAvailableClassesRequest({
        regionId: auth.region,
        zoneId,
        engine: defaults.engine,
        engineVersion: defaults.engineVersion,
        instanceChargeType: defaults.instanceChargeType,
        category: defaults.category,
        DBInstanceStorageType: defaults.storageType
      }));
    } catch (err: unknown) {
      if (isNotFoundError(err)) continue;
      throw err;
    }
    const zoneClassSet = zoneEntries.get(zoneId) || new Set<string>();
    for (const item of response.body?.DBInstanceClasses || []) {
      const normalizedClass = item.DBInstanceClass?.trim() || '';
      if (normalizedClass) zoneClassSet.add(normalizedClass);
      upsertDatabaseClassEntry(entries, {
        instanceClass: item.DBInstanceClass,
        zoneId,
        storageRange: {
          minGb: item.DBInstanceStorageRange?.minValue,
          maxGb: item.DBInstanceStorageRange?.maxValue,
          stepGb: item.DBInstanceStorageRange?.step
        }
      });
    }
    zoneEntries.set(zoneId, zoneClassSet);
    if (allZones) {
      await sleep(1200);
    }
  }
  if (entries.size === 0) {
    throw new Error(
      `未查询到 ${defaults.engine} 可售规格，请尝试调整 --zone / --engine-version / --category / --storage-type`
    );
  }

  return {
    regionId: auth.region,
    dbType,
    engine: defaults.engine,
    engineVersion: defaults.engineVersion,
    category: defaults.category,
    storageType: defaults.storageType,
    chargeType: defaults.instanceChargeType,
    zoneId: explicitZoneId || undefined,
    zoneIds: [...new Set(zoneIds)].sort(),
    queriedAllZones: allZones,
    defaultClass: defaults.defaultClass,
    classes: sortDatabaseClassEntries([...entries.values()]),
    zones: sortZoneClassEntries(
      [...zoneEntries.entries()].map(([zoneId, classes]) => ({
        zoneId,
        classCount: classes.size,
        classes: [...classes].sort()
      }))
    )
  };
}

export async function resolveDatabaseConnectInfo(explicitInstanceId?: string): Promise<DatabaseConnectInfo> {
  const project = Config.getProject();
  const projectDatabase = readProjectDatabase(project);
  const instanceId = explicitInstanceId?.trim() || projectDatabase.instanceId || '';
  if (!instanceId) throw new Error('未指定 DB 实例 ID，且当前项目未绑定数据库实例');

  const detail = await getDatabaseInstanceDetail(instanceId);
  const protocol = inferDbProtocol(detail.summary.engine);
  const endpoint = detail.endpoints.find((item) => item.ipType === 'Private' && item.host)
    || detail.endpoints.find((item) => item.host);
  const host = endpoint?.host?.trim();
  if (!host) throw new Error(`未获取到实例 ${instanceId} 的连接地址`);
  const port = Number(endpoint?.port || (protocol === 'postgresql' ? '5432' : '3306'));
  if (!Number.isFinite(port) || port <= 0) throw new Error(`实例 ${instanceId} 返回了无效端口`);

  const publicEndpoint = detail.endpoints.find((item) => item.ipType === 'Public' && item.host);

  const isSameProjectInstance = projectDatabase.instanceId === instanceId;
  const parsedProjectUrl = isSameProjectInstance ? parseDatabaseUrl(project.envs?.DATABASE_URL) : null;
  const username = parsedProjectUrl?.username || projectDatabase.user || '<username>';
  const database = parsedProjectUrl?.database || projectDatabase.name || detail.databases[0] || 'main';
  const rawPassword = parsedProjectUrl?.password || '';
  const passwordKnown = rawPassword.length > 0;
  const renderedPassword = passwordKnown ? encodeURIComponent(rawPassword) : '<password>';
  const renderedUser = username === '<username>' ? username : encodeURIComponent(username);
  const connectionString = `${protocol}://${renderedUser}:${renderedPassword}@${host}:${port}/${database}`;

  let publicHost: string | undefined;
  let publicPort: number | undefined;
  let publicConnectionString: string | undefined;
  if (publicEndpoint?.host) {
    publicHost = publicEndpoint.host.trim();
    publicPort = Number(publicEndpoint.port || port);
    publicConnectionString = `${protocol}://${renderedUser}:${renderedPassword}@${publicHost}:${publicPort}/${database}`;
  }

  return {
    instanceId,
    engine: protocol,
    host,
    port,
    database,
    username,
    passwordKnown,
    connectionString,
    publicHost,
    publicPort,
    publicConnectionString
  };
}

export async function deleteDatabaseInstance(instanceId: string) {
  const { client } = createRdsClient();
  await client.deleteDBInstance(new $Rds.DeleteDBInstanceRequest({ DBInstanceId: instanceId }));
}
