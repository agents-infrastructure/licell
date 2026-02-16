import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { Config } from '../../utils/config';
import { createRedisClient } from './client';
import {
  formatRedisUrlWithMask,
  isClassicRedisInstance,
  isTairServerlessInstance,
  parseRedisConnectionString,
  toClassicSummary,
  toTairSummary
} from './helpers';
import {
  getClassicInstanceById,
  getTairInstanceById,
  listTairKVCacheInstances
} from './internals';
import type { CacheConnectInfo, CacheInstanceDetail, CacheInstanceSummary } from './types';

export async function listCacheInstances(limit = 200): Promise<CacheInstanceSummary[]> {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);
  const results: CacheInstanceSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const response = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
      regionId: auth.region,
      pageNumber,
      pageSize: 50
    }));
    const rows = response.body?.instances?.KVStoreInstance || [];
    for (const row of rows) {
      const summary = toClassicSummary(row);
      if (!summary.instanceId) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    const total = response.body?.totalCount || 0;
    if (rows.length === 0 || (total > 0 && results.length >= total)) break;
  }

  if (results.length < safeLimit) {
    const tairInstances = await listTairKVCacheInstances(redisClient, auth.region);
    for (const instance of tairInstances) {
      const summary = toTairSummary(instance);
      if (!summary.instanceId) continue;
      if (results.some((item) => item.instanceId === summary.instanceId)) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
  }

  return results.slice(0, safeLimit);
}

export async function getCacheInstanceDetail(instanceId: string): Promise<CacheInstanceDetail> {
  const resolvedId = instanceId.trim();
  if (!resolvedId) throw new Error('instanceId 不能为空');
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);

  if (isClassicRedisInstance(resolvedId)) {
    const instance = await getClassicInstanceById(redisClient, auth, resolvedId);
    if (!instance?.instanceId) throw new Error(`未找到 Redis 实例: ${resolvedId}`);
    const accountsRes = await redisClient.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId: resolvedId }));
    const accountNames = (accountsRes.body?.accounts?.account || [])
      .map((item) => item.accountName)
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
    return {
      summary: toClassicSummary(instance),
      accountNames
    };
  }

  if (!isTairServerlessInstance(resolvedId)) {
    throw new Error('cache info 仅支持 tt-/tk-/r- 开头的实例 ID');
  }

  const attr = await getTairInstanceById(redisClient, resolvedId);
  if (!attr?.instanceId) throw new Error(`未找到 Tair 实例: ${resolvedId}`);
  const parsed = parseRedisConnectionString(attr.connectionString);
  const accountsRes = await redisClient.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId: resolvedId }));
  const accountNames = (accountsRes.body?.accounts?.account || [])
    .map((item) => item.accountName)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  return {
    summary: {
      instanceId: attr.instanceId,
      mode: 'tair-serverless-kv',
      instanceName: attr.instanceName,
      status: attr.instanceStatus,
      instanceClass: attr.instanceClass,
      host: parsed?.host,
      port: parsed?.port,
      zoneId: attr.zoneId,
      vpcId: attr.vpcId,
      vSwitchId: attr.vSwitchId
    },
    accountNames
  };
}

export async function resolveCacheConnectInfo(explicitInstanceId?: string): Promise<CacheConnectInfo> {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);
  const project = Config.getProject();
  const instanceId = explicitInstanceId?.trim() || project.cache?.instanceId || '';
  if (!instanceId) throw new Error('未指定缓存实例 ID，且当前项目未绑定缓存实例');
  const sameProjectInstance = project.cache?.instanceId === instanceId;
  const projectParsed = sameProjectInstance ? parseRedisConnectionString(project.envs?.REDIS_URL) : null;

  if (isClassicRedisInstance(instanceId)) {
    const instance = await getClassicInstanceById(redisClient, auth, instanceId);
    if (!instance?.instanceId) throw new Error(`未找到 Redis 实例: ${instanceId}`);
    const host = instance.connectionDomain || project.cache?.host || '';
    const port = instance.port || project.cache?.port || 6379;
    if (!host) throw new Error(`未获取到实例 ${instanceId} 的连接地址`);
    const username = projectParsed?.accountName || project.cache?.accountName || '<username>';
    const password = projectParsed?.password || '';
    const passwordKnown = password.length > 0;
    const connectionString = formatRedisUrlWithMask(
      username === '<username>' ? undefined : username,
      password,
      host,
      port,
      passwordKnown
    );
    return {
      instanceId,
      host,
      port,
      username: username === '<username>' ? undefined : username,
      passwordKnown,
      connectionString,
      mode: 'classic-redis'
    };
  }

  if (!isTairServerlessInstance(instanceId)) {
    throw new Error('cache connect 仅支持 tt-/tk-/r- 开头的实例 ID');
  }

  const attr = await getTairInstanceById(redisClient, instanceId);
  const parsed = parseRedisConnectionString(attr?.connectionString)
    || (project.cache?.host ? {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      accountName: project.cache.accountName,
      password: undefined
    } : null);
  if (!parsed?.host) throw new Error(`未获取到实例 ${instanceId} 的连接地址`);
  const username = projectParsed?.accountName || parsed.accountName || project.cache?.accountName;
  const password = projectParsed?.password || '';
  const passwordKnown = password.length > 0;
  const connectionString = formatRedisUrlWithMask(username, password, parsed.host, parsed.port, passwordKnown);

  return {
    instanceId,
    host: parsed.host,
    port: parsed.port,
    username,
    passwordKnown,
    connectionString,
    mode: 'tair-serverless-kv'
  };
}
