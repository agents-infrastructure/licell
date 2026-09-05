import { describe, expect, it, vi } from 'vitest';
import { listAcrInstances, listAcrNamespaces, listAcrRepositories, listAcrTags } from '../providers/cr-inventory';

describe('ACR inventory provider', () => {
  it('projects enterprise instances without resource-group identifiers', async () => {
    const client = { listInstance: vi.fn(async () => ({ body: { totalCount: 1, instances: [{ instanceId: 'cri-1', instanceName: 'main', instanceStatus: 'RUNNING', instanceSpecification: 'Enterprise_Basic', regionId: 'cn-shanghai', resourceGroupId: 'rg-secret', tags: [{ tagKey: 'env', tagValue: 'prod' }] }] } })) };

    const result = await listAcrInstances({ regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result).toMatchObject({ edition: 'enterprise', count: 1, instances: [expect.objectContaining({ instanceId: 'cri-1', name: 'main', tags: [{ key: 'env', value: 'prod' }] })] });
    expect(JSON.stringify(result)).not.toContain('rg-secret');
  });

  it('paginates namespaces and projects repository defaults', async () => {
    const client = { listNamespace: vi.fn(async () => ({ body: { totalCount: '1', namespaces: [{ namespaceId: 'crn-1', namespaceName: 'licell', namespaceStatus: 'NORMAL', autoCreateRepo: true, defaultRepoType: 'PRIVATE', resourceGroupId: 'rg-secret' }] } })) };

    const result = await listAcrNamespaces('cri-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.namespaces).toEqual([expect.objectContaining({ namespaceId: 'crn-1', name: 'licell', autoCreateRepository: true })]);
    expect(JSON.stringify(result)).not.toContain('rg-secret');
  });

  it('returns repository IDs required by the tag journey', async () => {
    const client = { listRepository: vi.fn(async () => ({ body: { totalCount: '1', repositories: [{ repoId: 'crr-1', repoName: 'app', repoNamespaceName: 'licell', repoStatus: 'NORMAL', repoType: 'PRIVATE', tagImmutability: true }] } })) };

    const result = await listAcrRepositories('cri-1', { regionId: 'cn-shanghai', namespace: 'licell', limit: 20 }, client as never);

    expect(result.repositories).toEqual([expect.objectContaining({ repositoryId: 'crr-1', namespace: 'licell', name: 'app', tagImmutability: true })]);
  });

  it('projects image tag metadata', async () => {
    const client = { listRepoTag: vi.fn(async () => ({ body: { totalCount: '1', images: [{ tag: 'v1.0.0', status: 'NORMAL', digest: 'sha256:abc', imageSize: 1024, imageId: 'internal-id' }] } })) };

    const result = await listAcrTags('cri-1', 'crr-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.tags).toEqual([expect.objectContaining({ tag: 'v1.0.0', digest: 'sha256:abc', sizeBytes: 1024 })]);
    expect(JSON.stringify(result)).not.toContain('internal-id');
  });
});
