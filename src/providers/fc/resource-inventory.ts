import FC20230330, * as $FC from '@alicloud/fc20230330';
import { createFcClient } from './client';
import { callFcWithGuard } from './request-guard';

const FUNCTION_RESOURCE_TYPE = 'ALIYUN::FC::FUNCTION';

export interface FunctionTagFilter {
  key: string;
  value?: string;
}

export interface FunctionTagQueryOptions {
  functionName?: string;
  tags?: FunctionTagFilter[];
  limit?: number;
  accountId?: string;
  regionId?: string;
}

function normalizeOptional(value: string | undefined) {
  return value?.trim() || undefined;
}

function normalizeRequired(value: string, field: string) {
  const normalized = normalizeOptional(value);
  if (!normalized) throw new Error(`${field} 不能为空`);
  return normalized;
}

function normalizeLimit(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 50), 200));
}

function functionNameFromResourceId(resourceId: string | undefined) {
  const encodedName = resourceId?.match(/(?:^|[:/])functions\/([^/]+)$/)?.[1];
  if (!encodedName) return undefined;
  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

export async function listFunctionVpcBindings(functionName: string, fcClient?: FC20230330) {
  const normalizedName = normalizeRequired(functionName, 'functionName');
  const client = fcClient ?? createFcClient().client;
  const response = await callFcWithGuard<$FC.ListVpcBindingsResponse>(
    client as unknown as Record<string, unknown>,
    'listVpcBindings',
    [normalizedName],
    { operation: `listVpcBindings(${normalizedName})`, profile: 'read' }
  );
  return {
    functionName: normalizedName,
    vpcIds: [...new Set((response.body?.vpcIds || []).filter(Boolean))]
  };
}

export async function listFunctionTags(
  options: FunctionTagQueryOptions,
  fcClient?: FC20230330
) {
  const functionName = normalizeOptional(options.functionName);
  const limit = normalizeLimit(options.limit);
  const tags = (options.tags || [])
    .map((tag) => ({ key: normalizeRequired(tag.key, 'tag key'), value: normalizeOptional(tag.value) }))
    .slice(0, 20);
  if (!functionName && tags.length === 0) {
    throw new Error('函数标签查询条件无效：请传入函数名或至少一个 --tag key=value');
  }
  const created = fcClient ? undefined : createFcClient();
  const client = fcClient ?? created!.client;
  const accountId = normalizeOptional(options.accountId) || created?.auth.accountId;
  const regionId = normalizeOptional(options.regionId) || created?.auth.region;
  if (functionName && (!accountId || !regionId)) {
    throw new Error('按函数名查询标签时需要 accountId 和 regionId 来构建 FC 资源 ID');
  }
  const resourceId = functionName
    ? `acs:fc:${regionId}:${accountId}:functions/${functionName}`
    : undefined;
  const tagResources: $FC.TagResource[] = [];
  let nextToken: string | undefined;
  let scannedCount = 0;
  let locallyTruncated = false;

  for (let page = 0; page < 50 && tagResources.length < limit; page += 1) {
    const response = await callFcWithGuard<$FC.ListTagResourcesResponse>(
      client as unknown as Record<string, unknown>,
      'listTagResources',
      [new $FC.ListTagResourcesRequest({
        limit: 100,
        nextToken,
        resourceId: resourceId ? [resourceId] : undefined,
        resourceType: FUNCTION_RESOURCE_TYPE,
        tag: tags.length > 0 ? tags.map((tag) => new $FC.ListTagResourcesRequestTag(tag)) : undefined
      })],
      { operation: 'listTagResources(FUNCTION)', profile: 'read' }
    );
    const rows = response.body?.tagResources || [];
    scannedCount += rows.length;
    const matched = functionName
      ? rows.filter((row) => functionNameFromResourceId(row.resourceId) === functionName)
      : rows;
    if (matched.length > limit - tagResources.length) locallyTruncated = true;
    tagResources.push(...matched.slice(0, limit - tagResources.length));
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return {
    functionName,
    resourceType: FUNCTION_RESOURCE_TYPE,
    limit,
    scannedCount,
    truncated: locallyTruncated || Boolean(nextToken),
    tagResources
  };
}
