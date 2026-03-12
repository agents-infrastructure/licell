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
import { describeClassicAvailableResource } from './zones';
import type {
  CacheClassCatalog,
  CacheClassEntry,
  CacheConnectInfo,
  CacheInstanceDetail,
  CacheInstanceSummary
} from './types';
import { DEFAULT_TAIR_KVCACHE_CLASS } from './types';

function upsertCacheClassEntry(
  entries: Map<string, CacheClassEntry>,
  input: {
    instanceClass?: unknown;
    remark?: unknown;
    capacityMb?: unknown;
    zoneId?: string;
    source: CacheClassEntry['source'];
  }
) {
  const instanceClass = typeof input.instanceClass === 'string' ? input.instanceClass.trim() : '';
  if (!instanceClass) return;
  const remark = typeof input.remark === 'string' ? input.remark.trim() : '';
  const capacityMb = typeof input.capacityMb === 'number' && Number.isFinite(input.capacityMb)
    ? input.capacityMb
    : undefined;
  const zoneId = input.zoneId?.trim() || '';
  const current = entries.get(instanceClass);
  const zoneIds = new Set([...(current?.zoneIds || []), ...(zoneId ? [zoneId] : [])]);
  entries.set(instanceClass, {
    instanceClass,
    remark: current?.remark || remark || undefined,
    capacityMb: current?.capacityMb ?? capacityMb,
    zoneIds: [...zoneIds].sort(),
    source: current?.source || input.source
  });
}

function collectClassicCacheClasses(
  value: unknown,
  entries: Map<string, CacheClassEntry>,
  currentZoneId?: string
) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectClassicCacheClasses(item, entries, currentZoneId);
    return;
  }
  const record = value as Record<string, unknown>;
  const zoneId = typeof record.zoneId === 'string' ? record.zoneId : currentZoneId;
  if (record.availableResources && typeof record.availableResources === 'object') {
    const availableResource = (record.availableResources as { availableResource?: unknown }).availableResource;
    if (Array.isArray(availableResource)) {
      for (const item of availableResource) {
        const entry = item as {
          instanceClass?: unknown;
          instanceClassRemark?: unknown;
          capacity?: unknown;
        };
        upsertCacheClassEntry(entries, {
          instanceClass: entry.instanceClass,
          remark: entry.instanceClassRemark,
          capacityMb: entry.capacity,
          zoneId,
          source: 'available-resource'
        });
      }
    }
  }
  for (const child of Object.values(record)) {
    collectClassicCacheClasses(child, entries, zoneId);
  }
}

function sortCacheClassEntries(entries: CacheClassEntry[]) {
  return [...entries].sort((a, b) => {
    const capacityA = a.capacityMb ?? Number.MAX_SAFE_INTEGER;
    const capacityB = b.capacityMb ?? Number.MAX_SAFE_INTEGER;
    if (capacityA !== capacityB) return capacityA - capacityB;
    return a.instanceClass.localeCompare(b.instanceClass);
  });
}

async function resolvePublicEndpoint(
  redisClient: Kvstore,
  instanceId: string
): Promise<{ host: string; port: number } | null> {
  try {
    const netRes = await redisClient.describeDBInstanceNetInfo(
      new $Kvstore.DescribeDBInstanceNetInfoRequest({ instanceId })
    );
    const infos = netRes.body?.netInfoItems?.instanceNetInfo || [];
    const pub = infos.find((i) => i.IPType === 'Public');
    if (pub?.connectionString) {
      return { host: pub.connectionString, port: Number(pub.port) || 6379 };
    }
  } catch { /* public endpoint not available */ }
  return null;
}

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

export async function listCacheClasses(options: { zoneId?: string } = {}): Promise<CacheClassCatalog> {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);

  const classicRes = await describeClassicAvailableResource(redisClient, auth.region, {
    zoneId: options.zoneId?.trim() || undefined
  });
  const classicEntries = new Map<string, CacheClassEntry>();
  const classicZones = (classicRes.body?.availableZones?.availableZone || [])
    .map((zone) => zone.zoneId)
    .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
  collectClassicCacheClasses(classicRes.body?.availableZones?.availableZone || [], classicEntries);

  const serverlessEntries = new Map<string, CacheClassEntry>();
  const inferInstances = await listTairKVCacheInstances(redisClient, auth.region);
  for (const item of inferInstances) {
    upsertCacheClassEntry(serverlessEntries, {
      instanceClass: item.instanceClass,
      capacityMb: typeof item.capacity === 'number' ? item.capacity * 1024 : undefined,
      zoneId: item.zoneId,
      source: 'observed-infer'
    });
  }

  return {
    regionId: auth.region,
    serverless: {
      querySupported: false,
      defaultClass: DEFAULT_TAIR_KVCACHE_CLASS,
      observedClasses: sortCacheClassEntries([...serverlessEntries.values()]),
      notes: [
        '阿里云当前未开放 Tair Serverless Infer/VNode 的可售 class 枚举接口。',
        'licell 只能稳定展示默认 class，以及当前账号在本地域已存在实例的观测 class。'
      ]
    },
    classic: {
      zoneIds: [...new Set(classicZones)].sort(),
      classes: sortCacheClassEntries([...classicEntries.values()])
    }
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

    const publicEndpoint = await resolvePublicEndpoint(redisClient, instanceId);

    return {
      instanceId,
      host,
      port,
      username: username === '<username>' ? undefined : username,
      passwordKnown,
      connectionString,
      mode: 'classic-redis',
      ...(publicEndpoint ? {
        publicHost: publicEndpoint.host,
        publicPort: publicEndpoint.port,
        publicConnectionString: formatRedisUrlWithMask(
          username === '<username>' ? undefined : username,
          password,
          publicEndpoint.host,
          publicEndpoint.port,
          passwordKnown
        )
      } : {})
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

  const publicEndpoint = await resolvePublicEndpoint(redisClient, instanceId);

  return {
    instanceId,
    host: parsed.host,
    port: parsed.port,
    username,
    passwordKnown,
    connectionString,
    mode: 'tair-serverless-kv',
    ...(publicEndpoint ? {
      publicHost: publicEndpoint.host,
      publicPort: publicEndpoint.port,
      publicConnectionString: formatRedisUrlWithMask(username, password, publicEndpoint.host, publicEndpoint.port, passwordKnown)
    } : {})
  };
}

export async function deleteCacheInstance(instanceId: string) {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);
  await redisClient.deleteInstance(new $Kvstore.DeleteInstanceRequest({ instanceId }));
}
