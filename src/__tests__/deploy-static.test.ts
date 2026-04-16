import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockDeployOSS,
  mockIssueAndBindSSLWithArtifacts,
  mockBindStaticDomainWorkflow,
  mockBindFunctionPreviewDomainWorkflow,
  mockProbeHttpHealth,
  mockDetectStaticDistDir,
  mockEmitCommandEvent,
  mockWithSpinner,
  mockToPromptValue
} = vi.hoisted(() => ({
  mockDeployOSS: vi.fn(),
  mockIssueAndBindSSLWithArtifacts: vi.fn(),
  mockBindStaticDomainWorkflow: vi.fn(),
  mockBindFunctionPreviewDomainWorkflow: vi.fn(),
  mockProbeHttpHealth: vi.fn(),
  mockDetectStaticDistDir: vi.fn(),
  mockEmitCommandEvent: vi.fn(),
  mockWithSpinner: vi.fn(),
  mockToPromptValue: vi.fn()
}));

vi.mock('../providers/oss', () => ({
  deployOSS: mockDeployOSS,
  resolveOssBucketName: vi.fn(() => 'demo-bucket')
}));

vi.mock('../providers/ssl', () => ({
  issueAndBindSSLWithArtifacts: mockIssueAndBindSSLWithArtifacts
}));

vi.mock('../workflows/domain', () => ({
  bindStaticDomainWorkflow: mockBindStaticDomainWorkflow
}));

vi.mock('../workflows/preview', () => ({
  bindFunctionPreviewDomainWorkflow: mockBindFunctionPreviewDomainWorkflow
}));

vi.mock('../utils/health-check', () => ({
  probeHttpHealth: mockProbeHttpHealth
}));

vi.mock('../utils/static-dist', () => ({
  detectStaticDistDir: mockDetectStaticDistDir
}));

vi.mock('../utils/output', () => ({
  emitCommandEvent: mockEmitCommandEvent
}));

vi.mock('../utils/cli-shared', () => ({
  toPromptValue: mockToPromptValue,
  withSpinner: mockWithSpinner
}));

vi.mock('../providers/fc/static-proxy.js', () => ({
  deployStaticProxyFunction: vi.fn(),
  publishStaticProxyVersion: vi.fn(),
  resolveStaticProxyFunctionName: vi.fn()
}));

vi.mock('../commands/deploy-preview', () => ({
  confirmPreviewWildcardDns: vi.fn(async () => true)
}));

import { executeStaticDeploy } from '../commands/deploy-static';

describe('executeStaticDeploy', () => {
  beforeEach(() => {
    mockDeployOSS.mockReset();
    mockIssueAndBindSSLWithArtifacts.mockReset();
    mockBindStaticDomainWorkflow.mockReset();
    mockBindFunctionPreviewDomainWorkflow.mockReset();
    mockProbeHttpHealth.mockReset();
    mockDetectStaticDistDir.mockReset();
    mockEmitCommandEvent.mockReset();
    mockWithSpinner.mockReset();
    mockToPromptValue.mockReset();

    mockDetectStaticDistDir.mockReturnValue('dist');
    mockToPromptValue.mockImplementation((value: unknown) => String(value));
    mockWithSpinner.mockImplementation(async (_spinner, _start, _fail, task) => task());
    mockDeployOSS.mockResolvedValue('https://demo-bucket.oss-cn-hangzhou.aliyuncs.com');
    mockIssueAndBindSSLWithArtifacts.mockResolvedValue({ certificate: 'cert', privateKey: 'key' });
    mockBindStaticDomainWorkflow.mockResolvedValue({
      domainName: 'static.example.com',
      bucketName: 'demo-bucket',
      originDomain: 'demo-bucket.oss-cn-hangzhou.aliyuncs.com',
      cdnCname: 'static.example.com.w.kunluncan.com',
      httpsConfigured: true,
      finalUrl: 'https://static.example.com'
    });
    mockProbeHttpHealth
      .mockResolvedValueOnce({ ok: true, statusCode: 200, checkedUrl: 'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/' })
      .mockResolvedValueOnce({ ok: true, statusCode: 200, checkedUrl: 'https://static.example.com/' });
  });

  it('uses a longer probe window for CDN-backed fixed static domains', async () => {
    const spinner = {
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn()
    };

    const result = await executeStaticDeploy({
      appName: 'demo-app',
      type: 'static',
      cliDomain: 'static.example.com',
      cliDist: 'dist',
      preview: false,
      domainSuffix: undefined,
      interactiveTTY: false,
      enableSSL: true,
      forceSslRenew: false,
      enableCdn: false
    } as never, spinner as never);

    expect(result?.fixedDomain).toBe('static.example.com');
    expect(mockProbeHttpHealth).toHaveBeenNthCalledWith(1, 'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com', {
      paths: [''],
      maxAttempts: 5,
      intervalMs: 1500,
      timeoutMs: 5000,
      allowClientError: false
    });
    expect(mockProbeHttpHealth).toHaveBeenNthCalledWith(2, 'https://static.example.com', {
      paths: ['/'],
      maxAttempts: 20,
      intervalMs: 5000,
      timeoutMs: 8000,
      allowClientError: false
    });
    expect(mockEmitCommandEvent.mock.calls.map(([event]) => event.stage)).toEqual(expect.arrayContaining([
      'deploy.static.upload',
      'deploy.static.ssl',
      'deploy.static.domain',
      'deploy.static.health.oss',
      'deploy.static.health.fixed-domain'
    ]));
  });
});
