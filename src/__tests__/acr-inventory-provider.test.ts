import { describe, expect, it, vi } from 'vitest';
import { inspectAcrScan, listAcrInstances, listAcrNamespaces, listAcrRepositories, listAcrTags } from '../providers/cr-inventory';

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

  it('returns scan status without querying incomplete results', async () => {
    const client = {
      getRepoTagScanStatus: vi.fn(async () => ({ body: { status: 'SCANNING', scanService: 'ACR_SCAN_SERVICE' } })),
      getRepoTagScanSummary: vi.fn(),
      listRepoTagScanResult: vi.fn()
    };

    const result = await inspectAcrScan('cri-1', 'crr-1', 'v1', { regionId: 'cn-shanghai' }, client as never);

    expect(result).toMatchObject({ status: 'SCANNING', complete: false, summary: null, count: 0, vulnerabilities: [] });
    expect(client.getRepoTagScanSummary).not.toHaveBeenCalled();
    expect(client.listRepoTagScanResult).not.toHaveBeenCalled();
  });

  it('projects completed scan results without executable or filesystem content', async () => {
    const client = {
      getRepoTagScanStatus: vi.fn(async () => ({ body: { status: 'COMPLETE', scanService: 'ACR_SCAN_SERVICE' } })),
      getRepoTagScanSummary: vi.fn(async () => ({ body: { totalSeverity: 3, highSeverity: 1, mediumSeverity: 1, lowSeverity: 1, unknownSeverity: 0 } })),
      listRepoTagScanResult: vi.fn(async () => ({ body: { totalCount: 1, vulnerabilities: [{
        cveName: 'CVE-2026-0001', severity: 'High', scanType: 'cve', feature: 'openssl', version: '1.0', versionFixed: '1.1', versionFormat: 'apk',
        fixCmd: 'apk upgrade openssl', cveLocation: '/usr/lib/libssl.so', addedBy: 'sha256:layer-secret', description: 'untrusted content', cveLink: 'https://example.invalid'
      }] } }))
    };

    const result = await inspectAcrScan('cri-1', 'crr-1', 'v1', { regionId: 'cn-shanghai', severity: 'High', scanType: 'cve', query: 'CVE-2026', limit: 20 }, client as never);

    expect(result).toMatchObject({
      status: 'COMPLETE', complete: true, summary: { total: 3, high: 1, medium: 1, low: 1, unknown: 0 }, count: 1,
      vulnerabilities: [{ cve: 'CVE-2026-0001', severity: 'High', type: 'cve', package: 'openssl', installedVersion: '1.0', fixedVersion: '1.1', packageFormat: 'apk' }]
    });
    expect(client.listRepoTagScanResult).toHaveBeenCalledWith(expect.objectContaining({ severity: 'High', scanType: 'cve', vulQueryKey: 'CVE-2026' }));
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('apk upgrade');
    expect(serialized).not.toContain('/usr/lib');
    expect(serialized).not.toContain('layer-secret');
    expect(serialized).not.toContain('untrusted content');
    expect(serialized).not.toContain('example.invalid');
  });
});
