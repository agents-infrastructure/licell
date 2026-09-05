import CR, * as $CR from '@alicloud/cr20181201';
import { Config } from '../utils/config';
import { callCrWithRetry, createCrClient } from './cr';

export interface AcrInventoryOptions {
  regionId?: string;
  limit?: number;
}

function requiredId(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} 不能为空`);
  return normalized;
}

function safeLimit(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 50), 200));
}

function resolveClient(regionId: string | undefined, injected?: CR) {
  if (injected) return { client: injected, regionId: regionId?.trim() || 'injected' };
  const auth = Config.requireAuth();
  return { client: createCrClient(auth), regionId: auth.region };
}

export async function listAcrInstances(
  options: AcrInventoryOptions & { status?: string } = {},
  injected?: CR
) {
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const instances: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNo = 1; pageNo <= 20 && instances.length < limit; pageNo += 1) {
    const response = await callCrWithRetry(() => client.listInstance(new $CR.ListInstanceRequest({
      instanceStatus: options.status?.trim() || undefined,
      pageNo,
      pageSize: 30
    })));
    const rows = response.body?.instances || [];
    totalCount = response.body?.totalCount;
    instances.push(...rows.slice(0, limit - instances.length).map((item) => ({
      instanceId: item.instanceId,
      name: item.instanceName,
      status: item.instanceStatus,
      specification: item.instanceSpecification,
      regionId: item.regionId,
      issue: item.instanceIssue,
      createdAt: item.createTime,
      modifiedAt: item.modifiedTime,
      tags: (item.tags || []).map((tag) => ({ key: tag.tagKey, value: tag.tagValue }))
    })));
    if (rows.length < 30 || (totalCount !== undefined && pageNo * 30 >= totalCount)) break;
  }

  return {
    regionId,
    edition: 'enterprise' as const,
    limit,
    totalCount,
    count: instances.length,
    truncated: totalCount !== undefined ? instances.length < totalCount : instances.length >= limit,
    instances
  };
}

export async function listAcrNamespaces(
  instanceId: string,
  options: AcrInventoryOptions & { name?: string; status?: string } = {},
  injected?: CR
) {
  const id = requiredId(instanceId, 'instanceId');
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const namespaces: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNo = 1; pageNo <= 20 && namespaces.length < limit; pageNo += 1) {
    const response = await callCrWithRetry(() => client.listNamespace(new $CR.ListNamespaceRequest({
      instanceId: id,
      namespaceName: options.name?.trim() || undefined,
      namespaceStatus: options.status?.trim() || undefined,
      pageNo,
      pageSize: 100
    })));
    const rows = response.body?.namespaces || [];
    const parsedTotal = Number(response.body?.totalCount);
    if (Number.isFinite(parsedTotal)) totalCount = parsedTotal;
    namespaces.push(...rows.slice(0, limit - namespaces.length).map((item) => ({
      namespaceId: item.namespaceId,
      name: item.namespaceName,
      status: item.namespaceStatus,
      autoCreateRepository: item.autoCreateRepo,
      defaultRepositoryType: item.defaultRepoType
    })));
    if (rows.length < 100 || (totalCount !== undefined && pageNo * 100 >= totalCount)) break;
  }

  return { instanceId: id, regionId, limit, totalCount, count: namespaces.length, truncated: totalCount !== undefined ? namespaces.length < totalCount : namespaces.length >= limit, namespaces };
}

export async function listAcrRepositories(
  instanceId: string,
  options: AcrInventoryOptions & { namespace?: string; name?: string; status?: string } = {},
  injected?: CR
) {
  const id = requiredId(instanceId, 'instanceId');
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const repositories: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNo = 1; pageNo <= 20 && repositories.length < limit; pageNo += 1) {
    const response = await callCrWithRetry(() => client.listRepository(new $CR.ListRepositoryRequest({
      instanceId: id,
      repoNamespaceName: options.namespace?.trim() || undefined,
      repoName: options.name?.trim() || undefined,
      repoStatus: options.status?.trim() || undefined,
      pageNo,
      pageSize: 100
    })));
    const rows = response.body?.repositories || [];
    const parsedTotal = Number(response.body?.totalCount);
    if (Number.isFinite(parsedTotal)) totalCount = parsedTotal;
    repositories.push(...rows.slice(0, limit - repositories.length).map((item) => ({
      repositoryId: item.repoId,
      name: item.repoName,
      namespace: item.repoNamespaceName,
      status: item.repoStatus,
      type: item.repoType,
      buildType: item.repoBuildType,
      tagImmutability: item.tagImmutability,
      summary: item.summary,
      createdAt: item.createTime,
      modifiedAt: item.modifiedTime
    })));
    if (rows.length < 100 || (totalCount !== undefined && pageNo * 100 >= totalCount)) break;
  }

  return { instanceId: id, regionId, limit, totalCount, count: repositories.length, truncated: totalCount !== undefined ? repositories.length < totalCount : repositories.length >= limit, repositories };
}

export async function listAcrTags(
  instanceId: string,
  repositoryId: string,
  options: AcrInventoryOptions = {},
  injected?: CR
) {
  const id = requiredId(instanceId, 'instanceId');
  const repoId = requiredId(repositoryId, 'repositoryId');
  const limit = safeLimit(options.limit);
  const { client, regionId } = resolveClient(options.regionId, injected);
  const tags: Array<Record<string, unknown>> = [];
  let totalCount: number | undefined;

  for (let pageNo = 1; pageNo <= 20 && tags.length < limit; pageNo += 1) {
    const response = await callCrWithRetry(() => client.listRepoTag(new $CR.ListRepoTagRequest({
      instanceId: id,
      repoId,
      pageNo,
      pageSize: 100
    })));
    const rows = response.body?.images || [];
    const parsedTotal = Number(response.body?.totalCount);
    if (Number.isFinite(parsedTotal)) totalCount = parsedTotal;
    tags.push(...rows.slice(0, limit - tags.length).map((item) => ({
      tag: item.tag,
      status: item.status,
      digest: item.digest,
      sizeBytes: item.imageSize,
      createdAt: item.imageCreate,
      updatedAt: item.imageUpdate
    })));
    if (rows.length < 100 || (totalCount !== undefined && pageNo * 100 >= totalCount)) break;
  }

  return { instanceId: id, repositoryId: repoId, regionId, limit, totalCount, count: tags.length, truncated: totalCount !== undefined ? tags.length < totalCount : tags.length >= limit, tags };
}
