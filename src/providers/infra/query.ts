import * as $Rds from '@alicloud/rds20140815';
import { Config } from '../../utils/config';
import { createRdsClient } from './client';
import { inferDbProtocol, parseDatabaseUrl, readProjectDatabase } from './project-db';
import type { DatabaseConnectInfo, DatabaseInstanceDetail, DatabaseInstanceSummary } from './types';

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

  const isSameProjectInstance = projectDatabase.instanceId === instanceId;
  const parsedProjectUrl = isSameProjectInstance ? parseDatabaseUrl(project.envs?.DATABASE_URL) : null;
  const username = parsedProjectUrl?.username || projectDatabase.user || '<username>';
  const database = parsedProjectUrl?.database || projectDatabase.name || detail.databases[0] || 'main';
  const rawPassword = parsedProjectUrl?.password || '';
  const passwordKnown = rawPassword.length > 0;
  const renderedPassword = passwordKnown ? encodeURIComponent(rawPassword) : '<password>';
  const renderedUser = username === '<username>' ? username : encodeURIComponent(username);
  const connectionString = `${protocol}://${renderedUser}:${renderedPassword}@${host}:${port}/${database}`;

  return {
    instanceId,
    engine: protocol,
    host,
    port,
    database,
    username,
    passwordKnown,
    connectionString
  };
}
