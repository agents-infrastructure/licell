import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetProject,
  mockEnsureDomainCname,
  mockRemoveDomainCname,
  mockEnableCdnForDomain,
  mockRemoveCdnDomain,
  mockIssueAndBindSSLWithArtifacts,
  mockGetOssBucketInfo,
  mockResolveOssBucketName,
  mockPublishFunctionVersion,
  mockPromoteFunctionAlias,
  mockRemoveFnCustomDomain,
  mockResolveDefaultFcGatewayDomain,
  mockUpsertFnCustomDomain,
  mockGetLatestPublishedVersionId
} = vi.hoisted(() => ({
  mockGetProject: vi.fn(),
  mockEnsureDomainCname: vi.fn(),
  mockRemoveDomainCname: vi.fn(),
  mockEnableCdnForDomain: vi.fn(),
  mockRemoveCdnDomain: vi.fn(),
  mockIssueAndBindSSLWithArtifacts: vi.fn(),
  mockGetOssBucketInfo: vi.fn(),
  mockResolveOssBucketName: vi.fn(),
  mockPublishFunctionVersion: vi.fn(),
  mockPromoteFunctionAlias: vi.fn(),
  mockRemoveFnCustomDomain: vi.fn(),
  mockResolveDefaultFcGatewayDomain: vi.fn(),
  mockUpsertFnCustomDomain: vi.fn(),
  mockGetLatestPublishedVersionId: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: mockGetProject,
    requireAuth: vi.fn(() => ({ region: 'cn-hangzhou' }))
  }
}));

vi.mock('../providers/dns', () => ({
  ensureDomainCname: mockEnsureDomainCname,
  normalizeDnsValue: (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\.$/, ''),
  removeDomainCname: mockRemoveDomainCname
}));

vi.mock('../providers/cdn', () => ({
  enableCdnForDomain: mockEnableCdnForDomain,
  removeCdnDomain: mockRemoveCdnDomain
}));

vi.mock('../providers/ssl', () => ({
  issueAndBindSSLWithArtifacts: mockIssueAndBindSSLWithArtifacts
}));

vi.mock('../providers/oss', () => ({
  getOssBucketInfo: mockGetOssBucketInfo,
  resolveOssBucketName: mockResolveOssBucketName
}));

vi.mock('../providers/fc', () => ({
  publishFunctionVersion: mockPublishFunctionVersion,
  promoteFunctionAlias: mockPromoteFunctionAlias,
  removeFnCustomDomain: mockRemoveFnCustomDomain,
  resolveDefaultFcGatewayDomain: mockResolveDefaultFcGatewayDomain,
  upsertFnCustomDomain: mockUpsertFnCustomDomain
}));

vi.mock('../utils/cli-shared', () => ({
  getLatestPublishedVersionId: mockGetLatestPublishedVersionId,
  isNoChangesPublishError: (err: unknown) => Boolean(err && typeof err === 'object' && (err as { code?: string }).code === 'NoChanges')
}));

import { bindAppDomainWorkflow } from '../workflows/domain';

describe('bindAppDomainWorkflow', () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockEnsureDomainCname.mockReset();
    mockRemoveDomainCname.mockReset();
    mockEnableCdnForDomain.mockReset();
    mockRemoveCdnDomain.mockReset();
    mockIssueAndBindSSLWithArtifacts.mockReset();
    mockGetOssBucketInfo.mockReset();
    mockResolveOssBucketName.mockReset();
    mockPublishFunctionVersion.mockReset();
    mockPromoteFunctionAlias.mockReset();
    mockRemoveFnCustomDomain.mockReset();
    mockResolveDefaultFcGatewayDomain.mockReset();
    mockUpsertFnCustomDomain.mockReset();
    mockGetLatestPublishedVersionId.mockReset();

    mockGetProject.mockReturnValue({ appName: 'demo-app' });
    mockResolveDefaultFcGatewayDomain.mockReturnValue('123456.cn-hangzhou.fc.aliyuncs.com');
    mockPublishFunctionVersion.mockResolvedValue('12');
    mockPromoteFunctionAlias.mockResolvedValue(undefined);
    mockUpsertFnCustomDomain.mockResolvedValue(undefined);
    mockEnableCdnForDomain.mockResolvedValue({
      cdnCname: 'api.example.com.w.cdngslb.com',
      created: true,
      httpsConfigured: true
    });
    mockIssueAndBindSSLWithArtifacts.mockResolvedValue({
      url: 'https://api.example.com',
      certificate: 'CERT',
      privateKey: 'KEY',
      reusedExistingCertificate: false
    });
  });

  it('binds app domain and ensures alias by default', async () => {
    const result = await bindAppDomainWorkflow(' Api.Example.com ', { releaseTarget: 'Prod' });

    expect(mockEnsureDomainCname).toHaveBeenCalledWith('api.example.com', '123456.cn-hangzhou.fc.aliyuncs.com');
    expect(mockUpsertFnCustomDomain).toHaveBeenCalledWith('api.example.com', {
      functionName: 'demo-app',
      qualifier: 'prod',
      path: '/*',
      protocol: 'HTTP'
    });
    expect(mockPublishFunctionVersion).toHaveBeenCalledTimes(1);
    expect(mockPromoteFunctionAlias).toHaveBeenCalledWith(
      'demo-app',
      'prod',
      '12',
      expect.stringContaining('domain bind by licell')
    );
    expect(result).toMatchObject({
      domainName: 'api.example.com',
      functionName: 'demo-app',
      releaseTarget: 'prod',
      aliasEnsured: true,
      cdnEnabled: false,
      domainHttpsConfigured: false,
      edgeHttpsConfigured: false,
      httpsConfigured: false,
      finalUrl: 'http://api.example.com'
    });
  });

  it('supports deploy-style app binding with CDN and SSL without re-ensuring alias', async () => {
    const spinner = {
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn()
    };

    const result = await bindAppDomainWorkflow('api.example.com', {
      functionName: 'demo-app',
      releaseTarget: 'staging',
      ensureAlias: false,
      enableCdn: true,
      enableHttps: true,
      spinner
    });

    expect(mockEnsureDomainCname).not.toHaveBeenCalled();
    expect(mockPublishFunctionVersion).not.toHaveBeenCalled();
    expect(mockPromoteFunctionAlias).not.toHaveBeenCalled();
    expect(mockIssueAndBindSSLWithArtifacts).toHaveBeenCalledWith(
      'api.example.com',
      spinner,
      { forceRenew: false }
    );
    expect(mockEnableCdnForDomain).toHaveBeenCalledWith(
      'api.example.com',
      '123456.cn-hangzhou.fc.aliyuncs.com',
      { certificate: 'CERT', privateKey: 'KEY' }
    );
    expect(result).toMatchObject({
      domainName: 'api.example.com',
      releaseTarget: 'staging',
      cdnEnabled: true,
      cdnCname: 'api.example.com.w.cdngslb.com',
      domainHttpsConfigured: true,
      edgeHttpsConfigured: true,
      httpsConfigured: true,
      finalUrl: 'https://api.example.com'
    });
  });

  it('falls back to http final url when CDN edge HTTPS is not configured', async () => {
    mockIssueAndBindSSLWithArtifacts.mockResolvedValue({
      url: 'https://api.example.com',
      reusedExistingCertificate: true
    });
    mockEnableCdnForDomain.mockResolvedValue({
      cdnCname: 'api.example.com.w.cdngslb.com',
      created: false,
      httpsConfigured: false
    });

    const result = await bindAppDomainWorkflow('api.example.com', {
      functionName: 'demo-app',
      enableCdn: true,
      enableHttps: true
    });

    expect(mockEnableCdnForDomain).toHaveBeenCalledWith(
      'api.example.com',
      '123456.cn-hangzhou.fc.aliyuncs.com',
      {}
    );
    expect(result).toMatchObject({
      domainHttpsConfigured: true,
      edgeHttpsConfigured: false,
      httpsConfigured: false,
      finalUrl: 'http://api.example.com'
    });
  });
});
