import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { isTerminalErrorStatus, uniqNonEmpty } from './helpers';
import { listTairKVCacheInstances } from './internals';

export interface CacheProvisionZoneResolution {
  preferredZoneIds: string[];
  classicZoneIds: string[];
  serverlessObservedZoneIds: string[];
}

export async function describeClassicAvailableResource(
  redisClient: Kvstore,
  regionId: string,
  options: { zoneId?: string } = {}
) {
  return redisClient.describeAvailableResource(new $Kvstore.DescribeAvailableResourceRequest({
    regionId,
    zoneId: options.zoneId?.trim() || undefined,
    engine: 'Redis',
    productType: 'Local',
    instanceChargeType: 'PostPaid',
    orderType: 'BUY',
    acceptLanguage: 'zh-CN'
  }));
}

export async function listClassicCacheAvailableZoneIds(
  redisClient: Kvstore,
  regionId: string,
  options: { zoneId?: string } = {}
) {
  try {
    const response = await describeClassicAvailableResource(redisClient, regionId, options);
    return uniqNonEmpty(
      (response.body?.availableZones?.availableZone || []).map((zone) => zone.zoneId)
    );
  } catch {
    return [];
  }
}

export async function listObservedTairZoneIds(redisClient: Kvstore, regionId: string) {
  try {
    const instances = await listTairKVCacheInstances(redisClient, regionId);
    return uniqNonEmpty(
      instances
        .filter((item) => {
          const status = item.instanceStatus || '';
          return !status || !isTerminalErrorStatus(status);
        })
        .map((item) => item.zoneId)
    );
  } catch {
    return [];
  }
}

export async function resolveCacheProvisionZoneIds(
  redisClient: Kvstore,
  regionId: string
): Promise<CacheProvisionZoneResolution> {
  const [serverlessObservedZoneIds, classicZoneIds] = await Promise.all([
    listObservedTairZoneIds(redisClient, regionId),
    listClassicCacheAvailableZoneIds(redisClient, regionId)
  ]);

  return {
    preferredZoneIds: uniqNonEmpty([...serverlessObservedZoneIds, ...classicZoneIds]),
    classicZoneIds,
    serverlessObservedZoneIds
  };
}
