import * as $Ecs from '@alicloud/ecs20140526';
import { createEcsClient } from './client';
import type {
  EcsInstanceDetail,
  EcsInstanceFilters,
  EcsInstanceSummary,
  EcsListInstancesOptions,
  EcsListInstancesResult
} from './types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 20;

type EcsInstanceRow = NonNullable<
  NonNullable<$Ecs.DescribeInstancesResponseBody['instances']>['instance']
>[number];

function normalizeTrimmed(value: string | undefined) {
  const trimmed = value?.trim() || '';
  return trimmed || undefined;
}

function uniqueNonEmpty(values: string[] | undefined) {
  return [...new Set((values || []).map((value) => value.trim()).filter(Boolean))];
}

function normalizeTags(tags: EcsInstanceFilters['tags']) {
  const normalized = (tags || [])
    .map((tag) => {
      const key = tag.key.trim();
      const value = tag.value?.trim();
      return key ? { key, ...(value ? { value } : {}) } : null;
    })
    .filter((tag): tag is { key: string; value?: string } => tag !== null);
  return normalized.length > 0 ? normalized : undefined;
}

function resolveLimit(limit: number | undefined) {
  if (limit === undefined) return DEFAULT_LIMIT;
  const normalized = Math.floor(limit);
  if (!Number.isFinite(normalized)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(normalized, MAX_LIMIT));
}

function normalizeFilters(options: EcsListInstancesOptions): EcsInstanceFilters {
  const name = normalizeTrimmed(options.name);
  const namePrefix = normalizeTrimmed(options.namePrefix);
  if (name && namePrefix) {
    throw new Error('name 与 namePrefix 不能同时传入，过滤条件无效');
  }
  const instanceIds = uniqueNonEmpty(options.instanceIds);
  const tags = normalizeTags(options.tags);
  return {
    ...(normalizeTrimmed(options.regionId) ? { regionId: normalizeTrimmed(options.regionId) } : {}),
    ...(instanceIds.length > 0 ? { instanceIds } : {}),
    ...(name ? { name } : {}),
    ...(namePrefix ? { namePrefix } : {}),
    ...(normalizeTrimmed(options.status) ? { status: normalizeTrimmed(options.status) } : {}),
    ...(normalizeTrimmed(options.zoneId) ? { zoneId: normalizeTrimmed(options.zoneId) } : {}),
    ...(normalizeTrimmed(options.vpcId) ? { vpcId: normalizeTrimmed(options.vpcId) } : {}),
    ...(normalizeTrimmed(options.vSwitchId) ? { vSwitchId: normalizeTrimmed(options.vSwitchId) } : {}),
    ...(normalizeTrimmed(options.instanceType) ? { instanceType: normalizeTrimmed(options.instanceType) } : {}),
    ...(normalizeTrimmed(options.chargeType) ? { chargeType: normalizeTrimmed(options.chargeType) } : {}),
    ...(normalizeTrimmed(options.privateIpAddress) ? { privateIpAddress: normalizeTrimmed(options.privateIpAddress) } : {}),
    ...(normalizeTrimmed(options.publicIpAddress) ? { publicIpAddress: normalizeTrimmed(options.publicIpAddress) } : {}),
    ...(normalizeTrimmed(options.eipAddress) ? { eipAddress: normalizeTrimmed(options.eipAddress) } : {}),
    ...(tags ? { tags } : {})
  };
}

function jsonArray(value: string | string[] | undefined) {
  if (!value) return undefined;
  const values = Array.isArray(value) ? value : [value];
  return JSON.stringify(values);
}

function buildDescribeInstancesRequest(input: {
  regionId: string;
  filters: EcsInstanceFilters;
  pageNumber: number;
  pageSize: number;
}) {
  return new $Ecs.DescribeInstancesRequest({
    regionId: input.regionId,
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    instanceIds: jsonArray(input.filters.instanceIds),
    instanceName: input.filters.name || (input.filters.namePrefix ? `${input.filters.namePrefix}*` : undefined),
    status: input.filters.status,
    zoneId: input.filters.zoneId,
    vpcId: input.filters.vpcId,
    vSwitchId: input.filters.vSwitchId,
    instanceType: input.filters.instanceType,
    instanceChargeType: input.filters.chargeType,
    privateIpAddresses: jsonArray(input.filters.privateIpAddress),
    publicIpAddresses: jsonArray(input.filters.publicIpAddress),
    eipAddresses: jsonArray(input.filters.eipAddress),
    tag: input.filters.tags?.map((tag) => new $Ecs.DescribeInstancesRequestTag(tag))
  });
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function normalizeEcsInstanceSummary(row: EcsInstanceRow, fallbackRegionId: string): EcsInstanceSummary {
  return {
    instanceId: row.instanceId || '',
    instanceName: row.instanceName,
    status: row.status,
    regionId: row.regionId || fallbackRegionId,
    zoneId: row.zoneId,
    instanceType: row.instanceType,
    osName: row.OSName,
    chargeType: row.instanceChargeType,
    vpcId: row.vpcAttributes?.vpcId,
    vSwitchId: row.vpcAttributes?.vSwitchId,
    privateIpAddresses: arrayOfStrings(row.vpcAttributes?.privateIpAddress?.ipAddress),
    publicIpAddresses: arrayOfStrings(row.publicIpAddress?.ipAddress),
    eipAddress: row.eipAddress?.ipAddress,
    securityGroupIds: arrayOfStrings(row.securityGroupIds?.securityGroupId),
    tags: (row.tags?.tag || [])
      .map((tag) => {
        const key = tag.tagKey?.trim() || '';
        const value = tag.tagValue?.trim();
        return key ? { key, ...(value ? { value } : {}) } : null;
      })
      .filter((tag): tag is { key: string; value?: string } => tag !== null),
    createdAt: row.creationTime,
    expiredAt: row.expiredTime
  };
}

export async function listEcsInstances(options: EcsListInstancesOptions = {}): Promise<EcsListInstancesResult> {
  const limit = resolveLimit(options.limit);
  const filters = normalizeFilters(options);
  const { regionId, client } = createEcsClient(filters.regionId);
  const requestFilters = { ...filters, regionId };
  const pageSize = Math.min(MAX_PAGE_SIZE, limit);
  const instances: EcsInstanceSummary[] = [];
  let totalCount: number | undefined;
  let rawRowsSeen = 0;
  let hitPageLimit = false;

  for (let pageNumber = 1; pageNumber <= MAX_PAGES && instances.length < limit; pageNumber += 1) {
    const response = await client.describeInstances(buildDescribeInstancesRequest({
      regionId,
      filters: requestFilters,
      pageNumber,
      pageSize
    }));
    const rows = response.body?.instances?.instance || [];
    rawRowsSeen += rows.length;
    totalCount = response.body?.totalCount ?? totalCount;

    for (const row of rows) {
      const summary = normalizeEcsInstanceSummary(row, regionId);
      if (!summary.instanceId) continue;
      instances.push(summary);
      if (instances.length >= limit) break;
    }

    if (rows.length === 0) break;
    if (typeof totalCount === 'number' && totalCount > 0 && rawRowsSeen >= totalCount) break;
    if (instances.length >= limit) break;
    if (pageNumber === MAX_PAGES) hitPageLimit = true;
  }

  const truncated = hitPageLimit || (typeof totalCount === 'number' && totalCount > rawRowsSeen);
  return {
    regionId,
    filters: requestFilters,
    totalCount,
    count: instances.length,
    limit,
    truncated,
    instances
  };
}

export async function getEcsInstanceDetail(
  instanceId: string,
  options: Pick<EcsListInstancesOptions, 'regionId'> = {}
): Promise<EcsInstanceDetail> {
  const resolvedId = instanceId.trim();
  if (!resolvedId) throw new Error('instanceId 不能为空，输入无效');
  const result = await listEcsInstances({
    regionId: options.regionId,
    instanceIds: [resolvedId],
    limit: 1
  });
  const summary = result.instances[0];
  if (!summary?.instanceId) {
    throw new Error(`ECS instance not exist: ${resolvedId}`);
  }
  return { summary };
}
