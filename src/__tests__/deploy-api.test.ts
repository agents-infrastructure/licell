import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSetProject,
  mockGetRuntime,
  mockEnsureDefaultNetwork,
  mockDeployFC,
  mockRunFcApiDeployPrecheck,
  mockCreateFcApiDeployPrecheckError,
  mockPublishFunctionVersion,
  mockPromoteFunctionAlias,
  mockBindAppDomainWorkflow,
  mockBindFunctionPreviewDomainWorkflow,
  mockProbeHttpHealth,
  mockWithSpinner
} = vi.hoisted(() => ({
  mockSetProject: vi.fn(),
  mockGetRuntime: vi.fn(),
  mockEnsureDefaultNetwork: vi.fn(),
  mockDeployFC: vi.fn(),
  mockRunFcApiDeployPrecheck: vi.fn(),
  mockCreateFcApiDeployPrecheckError: vi.fn(),
  mockPublishFunctionVersion: vi.fn(),
  mockPromoteFunctionAlias: vi.fn(),
  mockBindAppDomainWorkflow: vi.fn(),
  mockBindFunctionPreviewDomainWorkflow: vi.fn(),
  mockProbeHttpHealth: vi.fn(),
  mockWithSpinner: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    setProject: mockSetProject
  }
}));

vi.mock('../providers/fc/runtime-handler', () => ({
  getRuntime: mockGetRuntime
}));

vi.mock('../providers/vpc', () => ({
  ensureDefaultNetwork: mockEnsureDefaultNetwork
}));

vi.mock('../providers/fc', () => ({
  DEFAULT_FC_RUNTIME: 'nodejs22',
  createFcApiDeployPrecheckError: mockCreateFcApiDeployPrecheckError,
  deployFC: mockDeployFC,
  runFcApiDeployPrecheck: mockRunFcApiDeployPrecheck,
  publishFunctionVersion: mockPublishFunctionVersion,
  promoteFunctionAlias: mockPromoteFunctionAlias
}));

vi.mock('../workflows/domain', () => ({
  bindAppDomainWorkflow: mockBindAppDomainWorkflow
}));

vi.mock('../workflows/preview', () => ({
  bindFunctionPreviewDomainWorkflow: mockBindFunctionPreviewDomainWorkflow
}));

vi.mock('../commands/deploy-preview', () => ({
  confirmPreviewWildcardDns: vi.fn(async () => true)
}));

vi.mock('../utils/health-check', () => ({
  probeHttpHealth: mockProbeHttpHealth
}));

vi.mock('../utils/errors', () => ({
  formatErrorMessage: (err: unknown) => String(err)
}));

vi.mock('../utils/cli-shared', () => ({
  toPromptValue: (value: unknown) => String(value),
  withSpinner: mockWithSpinner
}));

vi.mock('../utils/output', () => ({
  isJsonOutput: () => false
}));

import { executeApiDeploy } from '../commands/deploy-api';

describe('executeApiDeploy', () => {
  beforeEach(() => {
    mockSetProject.mockReset();
    mockGetRuntime.mockReset();
    mockEnsureDefaultNetwork.mockReset();
    mockDeployFC.mockReset();
    mockRunFcApiDeployPrecheck.mockReset();
    mockCreateFcApiDeployPrecheckError.mockReset();
    mockPublishFunctionVersion.mockReset();
    mockPromoteFunctionAlias.mockReset();
    mockBindAppDomainWorkflow.mockReset();
    mockBindFunctionPreviewDomainWorkflow.mockReset();
    mockProbeHttpHealth.mockReset();
    mockWithSpinner.mockReset();

    mockGetRuntime.mockReturnValue({ defaultEntry: 'index.ts' });
    mockRunFcApiDeployPrecheck.mockReturnValue({ ok: true, issues: [] });
    mockDeployFC.mockResolvedValue('https://demo-app.fcapp.run');
    mockPublishFunctionVersion.mockResolvedValue('9');
    mockPromoteFunctionAlias.mockResolvedValue(undefined);
    mockBindAppDomainWorkflow.mockResolvedValue({
      domainName: 'api.example.com',
      functionName: 'demo-app',
      releaseTarget: 'prod',
      targetFcDomain: '123.cn-hangzhou.fc.aliyuncs.com',
      aliasEnsured: false,
      aliasVersionId: undefined,
      cdnEnabled: true,
      cdnCname: 'api.example.com.w.cdngslb.com',
      domainHttpsConfigured: true,
      edgeHttpsConfigured: true,
      httpsConfigured: true,
      finalUrl: 'https://api.example.com'
    });
    mockProbeHttpHealth
      .mockResolvedValueOnce({ ok: true, statusCode: 200, checkedUrl: 'https://demo-app.fcapp.run' })
      .mockResolvedValueOnce({ ok: true, statusCode: 200, checkedUrl: 'https://api.example.com' });
    mockWithSpinner.mockImplementation(async (_spinner, _start, _fail, task) => task());
  });

  it('reuses app domain workflow for fixed API domain and skips duplicate alias ensure', async () => {
    const spinner = {
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn()
    };

    const result = await executeApiDeploy({
      appName: 'demo-app',
      type: 'api',
      releaseTarget: 'prod',
      cliDomain: 'api.example.com',
      enableCdn: true,
      useVpc: false,
      enableSSL: true,
      forceSslRenew: false,
      preview: false,
      interactiveTTY: false,
      auth: { accountId: '123', region: 'cn-hangzhou' },
      project: {},
      cliRuntime: 'nodejs22',
      cliEntry: 'index.ts'
    } as never, spinner as never);

    expect(mockPublishFunctionVersion).toHaveBeenCalledTimes(1);
    expect(mockPromoteFunctionAlias).toHaveBeenCalledTimes(1);
    expect(mockBindAppDomainWorkflow).toHaveBeenCalledWith('api.example.com', expect.objectContaining({
      functionName: 'demo-app',
      releaseTarget: 'prod',
      ensureAlias: false,
      enableCdn: true,
      enableHttps: true,
      spinner
    }));
    expect(mockBindFunctionPreviewDomainWorkflow).not.toHaveBeenCalled();
    expect(mockProbeHttpHealth).toHaveBeenNthCalledWith(2, 'https://api.example.com', expect.any(Object));
    expect(result?.fixedDomain).toBe('api.example.com');
    expect(result?.promotedVersion).toBe('9');
  });
});
