import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockEnsureWildcardCname,
  mockListOssObjects,
  mockResolveOssBucketName,
  mockListFnCustomDomains,
  mockRemoveFnCustomDomain,
  mockResolveDefaultFcGatewayDomain,
  mockIssueAndBindSSLWithArtifacts,
  mockBindCustomDomain,
  mockDeleteObjectWithOptions
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockEnsureWildcardCname: vi.fn(),
  mockListOssObjects: vi.fn(),
  mockResolveOssBucketName: vi.fn(),
  mockListFnCustomDomains: vi.fn(),
  mockRemoveFnCustomDomain: vi.fn(),
  mockResolveDefaultFcGatewayDomain: vi.fn(),
  mockIssueAndBindSSLWithArtifacts: vi.fn(),
  mockBindCustomDomain: vi.fn(),
  mockDeleteObjectWithOptions: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: mockRequireAuth
  }
}));

vi.mock('../providers/dns', () => ({
  ensureWildcardCname: mockEnsureWildcardCname
}));

vi.mock('../providers/oss', () => ({
  listOssObjects: mockListOssObjects,
  resolveOssBucketName: mockResolveOssBucketName
}));

vi.mock('../providers/fc', () => ({
  listFnCustomDomains: mockListFnCustomDomains,
  removeFnCustomDomain: mockRemoveFnCustomDomain,
  resolveDefaultFcGatewayDomain: mockResolveDefaultFcGatewayDomain
}));

vi.mock('../providers/ssl', () => ({
  issueAndBindSSLWithArtifacts: mockIssueAndBindSSLWithArtifacts
}));

vi.mock('../workflows/domain', () => ({
  bindCustomDomain: mockBindCustomDomain
}));

vi.mock('@alicloud/oss20190517', () => ({
  default: class MockOssClient {
    deleteObjectWithOptions = mockDeleteObjectWithOptions;
  },
  DeleteObjectRequest: class DeleteObjectRequest {
    constructor(_input: unknown) {}
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(_input: unknown) {}
  }
}));

vi.mock('@alicloud/tea-util', () => ({
  RuntimeOptions: class RuntimeOptions {
    constructor(_input: unknown) {}
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor
}));

vi.mock('../utils/retry', () => ({
  withRetry: async (task: () => Promise<unknown>) => task()
}));

vi.mock('../utils/alicloud-error', () => ({
  isNotFoundError: () => false
}));

import { bindFunctionPreviewDomainWorkflow, prunePreviewDomainsWorkflow } from '../workflows/preview';

describe('preview workflows', () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockEnsureWildcardCname.mockReset();
    mockListOssObjects.mockReset();
    mockResolveOssBucketName.mockReset();
    mockListFnCustomDomains.mockReset();
    mockRemoveFnCustomDomain.mockReset();
    mockResolveDefaultFcGatewayDomain.mockReset();
    mockIssueAndBindSSLWithArtifacts.mockReset();
    mockBindCustomDomain.mockReset();
    mockDeleteObjectWithOptions.mockReset();

    mockRequireAuth.mockReturnValue({
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    });
    mockEnsureWildcardCname.mockResolvedValue({
      created: true,
      skipped: false,
      wildcardDomain: '*.example.com',
      targetValue: '123.cn-hangzhou.fc.aliyuncs.com'
    });
    mockResolveOssBucketName.mockReturnValue('demo-app-bucket');
    mockResolveDefaultFcGatewayDomain.mockReturnValue('123.cn-hangzhou.fc.aliyuncs.com');
    mockIssueAndBindSSLWithArtifacts.mockResolvedValue({
      url: 'https://demo-app-preview-v9.example.com',
      reusedExistingCertificate: false
    });
    mockBindCustomDomain.mockResolvedValue('http://demo-app-preview-v9.example.com');
    mockDeleteObjectWithOptions.mockResolvedValue(undefined);
  });

  it('binds preview domain through wildcard dns + fc custom domain + optional ssl', async () => {
    const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() };

    const result = await bindFunctionPreviewDomainWorkflow('demo-app', {
      functionName: 'demo-app',
      qualifier: '9',
      domainSuffix: 'example.com',
      interactiveTTY: false,
      enableHttps: true,
      forceSslRenew: true,
      spinner
    });

    expect(mockEnsureWildcardCname).toHaveBeenCalledWith('example.com', '123.cn-hangzhou.fc.aliyuncs.com', {
      interactiveTTY: false,
      skipConfirm: false,
      onConfirm: undefined
    });
    expect(mockBindCustomDomain).toHaveBeenCalledWith(
      'demo-app-preview-v9.example.com',
      '123.cn-hangzhou.fc.aliyuncs.com',
      '9',
      expect.objectContaining({ functionName: 'demo-app', skipDnsBind: true })
    );
    expect(mockIssueAndBindSSLWithArtifacts).toHaveBeenCalledWith(
      'demo-app-preview-v9.example.com',
      spinner,
      { forceRenew: true }
    );
    expect(result).toMatchObject({
      previewDomain: 'demo-app-preview-v9.example.com',
      httpsConfigured: true,
      finalUrl: 'https://demo-app-preview-v9.example.com'
    });
  });

  it('prunes old preview domains via shared workflow', async () => {
    mockListFnCustomDomains.mockResolvedValue([
      { domainName: 'demo-app-preview-v12.example.com' },
      { domainName: 'demo-app-preview-v9.example.com' },
      { domainName: 'demo-app-preview-v7.example.com' },
      { domainName: 'demo-app.example.com' }
    ]);
    mockListOssObjects.mockResolvedValue([
      { name: '_preview/9/index.html' },
      { name: '_preview/8/index.html' }
    ]);

    const result = await prunePreviewDomainsWorkflow('demo-app', 1, true);

    expect(result.candidates).toEqual([
      'demo-app-preview-v9.example.com',
      'demo-app-preview-v7.example.com'
    ]);
    expect(mockRemoveFnCustomDomain).toHaveBeenCalledTimes(2);
    expect(mockRemoveFnCustomDomain).toHaveBeenCalledWith('demo-app-preview-v9.example.com');
    expect(mockRemoveFnCustomDomain).toHaveBeenCalledWith('demo-app-preview-v7.example.com');
    expect(mockListOssObjects).toHaveBeenCalledWith('demo-app-bucket', '_preview/9/', 1000);
    expect(mockListOssObjects).toHaveBeenCalledWith('demo-app-bucket', '_preview/8/', 1000);
    expect(result.deletedDomains).toEqual([
      'demo-app-preview-v9.example.com',
      'demo-app-preview-v7.example.com'
    ]);
    expect(result.deletedOssPaths).toContain('_preview/9/');
  });
});
