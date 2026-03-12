import Rds, * as $Rds from '@alicloud/rds20140815';

function versionMatches(expectedVersion: string, availableVersion?: string) {
  if (!availableVersion) return false;
  if (availableVersion === expectedVersion) return true;
  const expectedMajor = expectedVersion.split('.')[0];
  const availableMajor = availableVersion.split('.')[0];
  return expectedMajor.length > 0 && expectedMajor === availableMajor;
}

export async function resolveDatabaseAvailableZoneIds(
  rdsClient: Rds,
  regionId: string,
  dbType: 'postgres' | 'mysql',
  options: {
    engine: string;
    engineVersion: string;
    category: string;
  }
) {
  if (dbType === 'postgres') {
    try {
      const zoneRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
        regionId,
        engine: options.engine,
        engineVersion: options.engineVersion,
        category: options.category
      }));
      const zoneIds = (zoneRes.body?.availableZones || [])
        .map((zone) => zone.zoneId)
        .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
      return [...new Set(zoneIds)];
    } catch {
      return [];
    }
  }

  try {
    const directRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
      regionId,
      engine: options.engine,
      engineVersion: options.engineVersion,
      category: options.category
    }));
    const zoneIds = (directRes.body?.availableZones || [])
      .map((zone) => zone.zoneId)
      .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
    if (zoneIds.length > 0) return [...new Set(zoneIds)];
  } catch { /* serverless_basic category query may not be supported in all regions */ }

  try {
    const fallbackRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
      regionId,
      engine: options.engine,
      engineVersion: options.engineVersion
    }));
    const zones = fallbackRes.body?.availableZones || [];
    const matched: string[] = [];
    for (const zone of zones) {
      const zoneId = zone.zoneId;
      if (typeof zoneId !== 'string' || zoneId.length === 0) continue;
      const hasServerlessCategory = (zone.supportedEngines || []).some((supportedEngine) => {
        if ((supportedEngine.engine || '').toLowerCase() !== options.engine.toLowerCase()) return false;
        return (supportedEngine.supportedEngineVersions || []).some((supportedVersion) => {
          if (!versionMatches(options.engineVersion, supportedVersion.version)) return false;
          return (supportedVersion.supportedCategorys || []).some((category) => category.category === options.category);
        });
      });
      if (hasServerlessCategory) matched.push(zoneId);
    }
    if (matched.length > 0) return [...new Set(matched)];

    const allZoneIds = zones
      .map((zone) => zone.zoneId)
      .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
    return [...new Set(allZoneIds)];
  } catch {
    return [];
  }
}
